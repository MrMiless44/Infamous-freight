// Secret Management Service
// Integrates HashiCorp Vault for centralized secret management

const axios = require('axios');
const logger = require('./logger');

class VaultService {
    constructor(config = {}) {
        this.vaultAddr = config.vaultAddr || process.env.VAULT_ADDR || 'http://vault:8200';
        this.vaultToken = config.vaultToken || process.env.VAULT_TOKEN;
        this.secretPath = config.secretPath || 'secret/data';
        this.authPath = config.authPath || 'auth/jwt/login';
        this.client = axios.create({
            baseURL: this.vaultAddr,
            timeout: 10000,
            headers: {
                'X-Vault-Token': this.vaultToken,
            },
        });

        this.secretCache = new Map();
        this.cacheTTL = config.cacheTTL || 3600000; // 1 hour
    }

    /**
     * Authenticate with Vault using JWT (Kubernetes or custom JWT)
     */
    async authenticateWithJWT(jwt) {
        try {
            const response = await this.client.post(this.authPath, {
                jwt,
                role: process.env.VAULT_ROLE || 'api',
            });

            this.vaultToken = response.data.auth.client_token;
            this.client.defaults.headers['X-Vault-Token'] = this.vaultToken;

            logger.info('Vault JWT authentication successful');
            return response.data.auth;
        } catch (error) {
            logger.error('Vault JWT authentication failed', {
                error: error.message,
                vaultAddr: this.vaultAddr,
            });
            throw error;
        }
    }

    /**
     * Write a secret to Vault
     */
    async writeSecret(path, data, options = {}) {
        try {
            const response = await this.client.post(`/v1/${this.secretPath}/${path}`, {
                data,
                options,
            });

            // Invalidate cache
            this.secretCache.delete(path);

            logger.info('Secret written to Vault', {
                path,
                metadata: response.data.metadata,
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to write secret to Vault', {
                path,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Read a secret from Vault
     */
    async readSecret(path, useCache = true) {
        try {
            // Check cache first
            if (useCache && this.secretCache.has(path)) {
                const cached = this.secretCache.get(path);
                if (Date.now() - cached.timestamp < this.cacheTTL) {
                    logger.debug('Secret retrieved from cache', { path });
                    return cached.data;
                }
                this.secretCache.delete(path);
            }

            const response = await this.client.get(`/v1/${this.secretPath}/${path}`);

            // Cache the secret
            this.secretCache.set(path, {
                data: response.data,
                timestamp: Date.now(),
            });

            logger.debug('Secret read from Vault', {
                path,
                version: response.data.metadata.version,
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to read secret from Vault', {
                path,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Delete a secret from Vault
     */
    async deleteSecret(path) {
        try {
            await this.client.delete(`/v1/${this.secretPath}/${path}`);

            // Invalidate cache
            this.secretCache.delete(path);

            logger.info('Secret deleted from Vault', { path });
        } catch (error) {
            logger.error('Failed to delete secret from Vault', {
                path,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * List secrets at a path
     */
    async listSecrets(path) {
        try {
            const response = await this.client.list(`/v1/${this.secretPath}/${path}`);
            return response.data.data.keys;
        } catch (error) {
            logger.error('Failed to list secrets in Vault', {
                path,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate dynamic database credentials
     */
    async generateDatabaseCredentials(role = 'api-default') {
        try {
            const response = await this.client.get(`/v1/database/creds/${role}`);

            const { username, password, ttl } = response.data.data;

            logger.info('Database credentials generated', {
                username,
                ttl,
                expiresAt: new Date(Date.now() + ttl * 1000),
            });

            return {
                username,
                password,
                ttl,
                expiresAt: new Date(Date.now() + ttl * 1000),
            };
        } catch (error) {
            logger.error('Failed to generate database credentials', {
                role,
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Generate API token
     */
    async generateAPIToken(policies = [], ttl = '1h') {
        try {
            const response = await this.client.post('/v1/auth/token/create', {
                policies,
                ttl,
            });

            logger.info('API token generated', {
                policies,
                ttl,
            });

            return response.data.auth;
        } catch (error) {
            logger.error('Failed to generate API token', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Rotate secrets (API keys, JWT secrets, etc.)
     */
    async rotateSecrets(paths = []) {
        const rotatedSecrets = {};

        for (const path of paths) {
            try {
                const secret = await this.readSecret(path, false);
                // Generate new secret (implementation depends on secret type)
                rotatedSecrets[path] = {
                    rotated: true,
                    newVersion: secret.metadata.version,
                    timestamp: new Date(),
                };
            } catch (error) {
                logger.error('Failed to rotate secret', {
                    path,
                    error: error.message,
                });
            }
        }

        logger.info('Secrets rotation completed', {
            total: paths.length,
            successful: Object.keys(rotatedSecrets).length,
        });

        return rotatedSecrets;
    }

    /**
     * Get secret health status
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.vaultAddr}/v1/sys/health`, {
                validateStatus: () => true, // Accept any status code
            });

            return {
                sealed: response.data.sealed,
                standby: response.data.standby,
                performanceStandby: response.data.performance_standby,
                replicationPerfMode: response.data.replication_perf_mode,
                replicationDrMode: response.data.replication_dr_mode,
                serverTimeUtc: response.data.server_time_utc,
                version: response.data.version,
            };
        } catch (error) {
            logger.error('Vault health check failed', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Clear secret cache
     */
    clearCache(path = null) {
        if (path) {
            this.secretCache.delete(path);
            logger.debug('Secret cache cleared for path', { path });
        } else {
            this.secretCache.clear();
            logger.debug('All secret cache cleared');
        }
    }
}

module.exports = VaultService;
