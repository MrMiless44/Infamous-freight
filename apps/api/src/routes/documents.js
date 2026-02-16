/**
 * Document OCR Routes
 * Document scanning and data extraction endpoints
 */

const express = require("express");
const multer = require("multer");
const { limiters, authenticate, requireScope, auditLog } = require("../middleware/security");
const { validateString, handleValidationErrors } = require("../middleware/validation");
const documentOCR = require("../services/documentOCR");
const { logger } = require("../middleware/logger");

const router = express.Router();

// Configure Multer for document uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Allowed: JPEG, PNG, WEBP, PDF"));
    }
  },
});

/**
 * POST /api/documents/ocr
 * Extract text and data from document image
 */
router.post(
  "/documents/ocr",
  limiters.general,
  authenticate,
  requireScope("documents:process"),
  auditLog,
  upload.single("document"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          error: "No document file uploaded",
        });
      }

      const documentType = req.body.documentType || "BOL";
      const options = {
        mimeType: req.file.mimetype,
      };

      const result = await documentOCR.processDocument(req.file.buffer, documentType, options);

      res.json({
        ok: true,
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/documents/ocr/batch
 * Process multiple documents in batch
 */
router.post(
  "/documents/ocr/batch",
  limiters.general,
  authenticate,
  requireScope("documents:process"),
  auditLog,
  upload.array("documents", 10),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "No document files uploaded",
        });
      }

      // Parse document types from request body
      const documentTypes = JSON.parse(req.body.documentTypes || "[]");

      // Prepare documents for batch processing
      const documents = req.files.map((file, index) => ({
        id: `doc_${index}`,
        buffer: file.buffer,
        type: documentTypes[index] || "BOL",
        options: {
          mimeType: file.mimetype,
        },
      }));

      const results = await documentOCR.batchProcessDocuments(documents);

      res.json({
        ok: true,
        ...results,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/documents/ocr/supported-types
 * Get list of supported document types
 */
router.get(
  "/documents/ocr/supported-types",
  limiters.general,
  authenticate,
  requireScope("documents:read"),
  async (req, res, next) => {
    try {
      const supportedTypes = documentOCR.documentTypes;

      res.json({
        ok: true,
        supportedTypes,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
