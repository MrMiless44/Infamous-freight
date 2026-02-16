/**
 * Automated Database Backup & Disaster Recovery Service
 * Handles PostgreSQL backups, verification, and restore procedures
 */

const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");
const AWS = require("@aws-sdk/client-s3");
const { logger } = require("../middleware/logger");

const execAsync = promisify(exec);

/**
 * Backup types and strategies
 */
const BackupTypes = {
  FULL: "full", // Full database dump
  INCREMENTAL: "incremental", // Changes since last backup
  PHYSICAL: "physical", // PostgreSQL file system backup
};

/**
 * Configuration for backups
 */
const BackupConfig = {
  backupDir: process.env.BACKUP_DIR || "/var/backups/infamousfreight",
  s3Bucket: process.env.BACKUP_S3_BUCKET || "infamous-freight-backups",
  s3Region: process.env.AWS_REGION || "us-east-1",
  retentionDays: 30,
  compressionLevel: 9, // Maximum compression (gzip -9)
};

/**
 * Initialize S3 client for backup uploads
 */
const s3Client = new AWS.S3Client({
  region: BackupConfig.s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Create full database backup using pg_dump
 */
async function createFullBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const backupFile = path.join(BackupConfig.backupDir, `backup-full-${timestamp}.sql.gz`);

    logger.info("Starting full database backup", { backupFile });

    // Ensure backup directory exists
    await fs.mkdir(BackupConfig.backupDir, { recursive: true });

    // Execute pg_dump with compression
    return new Promise((resolve, reject) => {
      const cmd = `pg_dump "${process.env.DATABASE_URL}" | gzip -${BackupConfig.compressionLevel} > "${backupFile}"`;

      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          logger.error("Full backup failed", { error: error.message });
          reject(error);
          return;
        }

        try {
          // Verify backup file
          const stats = await fs.stat(backupFile);
          const sizeGB = (stats.size / 1024 / 1024 / 1024).toFixed(2);

          logger.info("Full backup completed", {
            file: backupFile,
            sizeGB,
          });

          resolve({
            type: BackupTypes.FULL,
            file: backupFile,
            sizeBytes: stats.size,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    logger.error("Failed to create full backup", { error: error.message });
    throw error;
  }
}

/**
 * Create incremental backup using WAL archiving
 */
async function createIncrementalBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const backupFile = path.join(BackupConfig.backupDir, `backup-incremental-${timestamp}.tar.gz`);

    logger.info("Starting incremental backup", { backupFile });

    // Execute pg_basebackup for streaming backup
    return new Promise((resolve, reject) => {
      const cmd = `pg_basebackup -D - -Ft -z -P | gzip -${BackupConfig.compressionLevel} > "${backupFile}"`;

      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          logger.error("Incremental backup failed", { error: error.message });
          reject(error);
          return;
        }

        try {
          const stats = await fs.stat(backupFile);
          logger.info("Incremental backup completed", {
            file: backupFile,
            sizeGB: (stats.size / 1024 / 1024 / 1024).toFixed(2),
          });

          resolve({
            type: BackupTypes.INCREMENTAL,
            file: backupFile,
            sizeBytes: stats.size,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    logger.error("Failed to create incremental backup", { error: error.message });
    throw error;
  }
}

/**
 * Upload backup to S3
 */
async function uploadBackupToS3(backupFile) {
  try {
    const fileName = path.basename(backupFile);
    const fileContent = await fs.readFile(backupFile);

    logger.info("Uploading backup to S3", {
      bucket: BackupConfig.s3Bucket,
      key: `backups/${fileName}`,
    });

    const command = new AWS.PutObjectCommand({
      Bucket: BackupConfig.s3Bucket,
      Key: `backups/${fileName}`,
      Body: fileContent,
      ServerSideEncryption: "AES256",
      Metadata: {
        "backup-date": new Date().toISOString(),
        "backup-type": "postgres",
      },
    });

    await s3Client.send(command);

    logger.info("Backup uploaded to S3", {
      url: `s3://${BackupConfig.s3Bucket}/backups/${fileName}`,
    });

    return {
      bucket: BackupConfig.s3Bucket,
      key: `backups/${fileName}`,
      uploaded: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to upload backup to S3", { error: error.message });
    throw error;
  }
}

/**
 * Create backup with S3 upload
 */
async function createBackupWithUpload(backupType = BackupTypes.FULL) {
  try {
    let backup;

    if (backupType === BackupTypes.INCREMENTAL) {
      backup = await createIncrementalBackup();
    } else {
      backup = await createFullBackup();
    }

    // Upload to S3
    const s3Info = await uploadBackupToS3(backup.file);

    // Delete local backup after successful S3 upload
    await fs.unlink(backup.file);
    logger.info("Local backup file deleted after S3 upload", { file: backup.file });

    return {
      ...backup,
      s3: s3Info,
    };
  } catch (error) {
    logger.error("Backup creation with upload failed", { error: error.message });
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreFromBackup(backupFile, targetDatabase = null) {
  try {
    const db = targetDatabase || new URL(process.env.DATABASE_URL).pathname.slice(1);

    logger.warn("Starting database restore", {
      backupFile,
      targetDatabase: db,
      timestamp: new Date().toISOString(),
    });

    // TODO: Add checks to prevent accidental restore to production
    if (process.env.NODE_ENV === "production") {
      logger.error("Restore attempted on production database", {
        backupFile,
        timestamp: new Date().toISOString(),
      });
      throw new Error("Database restore not allowed on production without explicit approval");
    }

    return new Promise((resolve, reject) => {
      const cmd = `gunzip < "${backupFile}" | psql "${process.env.DATABASE_URL}"`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          logger.error("Database restore failed", { error: error.message });
          reject(error);
          return;
        }

        logger.info("Database restore completed", {
          backupFile,
          targetDatabase: db,
        });

        resolve({
          success: true,
          database: db,
          restoredAt: new Date().toISOString(),
        });
      });
    });
  } catch (error) {
    logger.error("Failed to restore from backup", { error: error.message });
    throw error;
  }
}

/**
 * Download backup from S3 for local restore
 */
async function downloadBackupFromS3(backupKey) {
  try {
    logger.info("Downloading backup from S3", {
      bucket: BackupConfig.s3Bucket,
      key: backupKey,
    });

    const command = new AWS.GetObjectCommand({
      Bucket: BackupConfig.s3Bucket,
      Key: backupKey,
    });

    const response = await s3Client.send(command);
    const content = await response.Body.transformToString();

    const localFile = path.join(BackupConfig.backupDir, path.basename(backupKey));
    await fs.writeFile(localFile, content);

    logger.info("Backup downloaded from S3", { localFile });

    return localFile;
  } catch (error) {
    logger.error("Failed to download backup from S3", { error: error.message });
    throw error;
  }
}

/**
 * List all backups in S3
 */
async function listBackups() {
  try {
    const command = new AWS.ListObjectsV2Command({
      Bucket: BackupConfig.s3Bucket,
      Prefix: "backups/",
    });

    const response = await s3Client.send(command);

    const backups = (response.Contents || [])
      .map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        sizeGB: (obj.Size / 1024 / 1024 / 1024).toFixed(2),
      }))
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    logger.info("Listed backups from S3", { count: backups.length });

    return backups;
  } catch (error) {
    logger.error("Failed to list backups", { error: error.message });
    throw error;
  }
}

/**
 * Delete old backups (retention policy)
 */
async function cleanupOldBackups() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BackupConfig.retentionDays);

    const backups = await listBackups();
    const toDelete = backups.filter((b) => new Date(b.lastModified) < cutoffDate);

    logger.info("Cleaning up old backups", {
      retentionDays: BackupConfig.retentionDays,
      toDeleteCount: toDelete.length,
    });

    for (const backup of toDelete) {
      const command = new AWS.DeleteObjectCommand({
        Bucket: BackupConfig.s3Bucket,
        Key: backup.key,
      });

      await s3Client.send(command);
      logger.info("Deleted old backup", { key: backup.key });
    }

    return { deleted: toDelete.length };
  } catch (error) {
    logger.error("Failed to cleanup old backups", { error: error.message });
    throw error;
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupFile) {
  try {
    logger.info("Verifying backup integrity", { backupFile });

    return new Promise((resolve, reject) => {
      // Test gunzip can read the file
      const cmd = `gunzip -t "${backupFile}"`;

      exec(cmd, (error) => {
        if (error) {
          logger.error("Backup verification failed", {
            backupFile,
            error: error.message,
          });
          reject(error);
          return;
        }

        logger.info("Backup verified successfully", { backupFile });
        resolve({ valid: true, file: backupFile });
      });
    });
  } catch (error) {
    logger.error("Failed to verify backup", { error: error.message });
    throw error;
  }
}

/**
 * Get backup statistics and health
 */
async function getBackupStats() {
  try {
    const backups = await listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const latestBackup = backups[0];
    const daysSinceLatest = latestBackup
      ? Math.floor(
          (Date.now() - new Date(latestBackup.lastModified).getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      totalBackups: backups.length,
      totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
      latestBackup: latestBackup
        ? {
            key: latestBackup.key,
            date: latestBackup.lastModified,
            daysSinceBackup: daysSinceLatest,
          }
        : null,
      retentionDays: BackupConfig.retentionDays,
      healthy: daysSinceLatest < 2, // Alert if no backup in 2 days
    };
  } catch (error) {
    logger.error("Failed to get backup stats", { error: error.message });
    return null;
  }
}

module.exports = {
  // Constants
  BackupTypes,
  BackupConfig,

  // Functions
  createFullBackup,
  createIncrementalBackup,
  uploadBackupToS3,
  createBackupWithUpload,
  restoreFromBackup,
  downloadBackupFromS3,
  listBackups,
  cleanupOldBackups,
  verifyBackup,
  getBackupStats,
};
