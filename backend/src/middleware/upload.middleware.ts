import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../utils/AppError';
import { StatusCodes } from 'http-status-codes';

// Use Memory Storage so we can inspect bytes before writing to disk/S3
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.warn(`[SECURITY] ${req.id || 'unknown'} - Rejected MIME type: ${file.mimetype}`);
    cb(new AppError('Unsupported file format. Allowed: JPG, PNG, WEBP, PDF, TXT, DOC, DOCX.', StatusCodes.BAD_REQUEST, 'INVALID_FILE_TYPE'));
  }
};

// Raw multer middleware
export const uploadRaw = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB global max (can be refined per category later)
  },
});

/**
 * Advanced Magic Byte Validator Middleware
 * Runs AFTER multer memory storage, BEFORE controller
 */
export const validateMagicBytes = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(); // No file uploaded, pass through
  }

  try {
    const fileInfo = await fileTypeFromBuffer(req.file.buffer);

    // text/plain files have no magic bytes; validate the buffer is actually
    // plain ASCII/UTF-8 text and reject anything with control chars that
    // could indicate a smuggled binary or HTML/script payload.
    if (req.file.mimetype === 'text/plain') {
      const buf = req.file.buffer;
      // Sniff up to 8KB — plenty to catch shell scripts, HTML, PDFs claiming text.
      const head = buf.slice(0, 8192);
      // Reject any control byte other than \t \n \r
      for (let i = 0; i < head.length; i++) {
        const b = head[i];
        if (b < 0x09 || (b > 0x0d && b < 0x20)) {
          console.warn(`[SECURITY] ${req.id || 'unknown'} - text/plain upload contains binary bytes`);
          throw new AppError('text/plain payload contains non-text bytes.', StatusCodes.BAD_REQUEST, 'FILE_SPOOF_DETECTED');
        }
      }
      // Also reject if it looks like HTML/JS/PHP — cheap first-line sniff.
      const asString = head.toString('utf8', 0, Math.min(head.length, 512)).trim().toLowerCase();
      if (asString.startsWith('<!doctype') || asString.startsWith('<html') || asString.startsWith('<script') || asString.startsWith('<?php')) {
        console.warn(`[SECURITY] ${req.id || 'unknown'} - text/plain upload looks like markup/code`);
        throw new AppError('text/plain payload looks like markup or code.', StatusCodes.BAD_REQUEST, 'FILE_SPOOF_DETECTED');
      }
      return next();
    }

    if (!fileInfo || !ALLOWED_MIME_TYPES.includes(fileInfo.mime)) {
      console.warn(`[SECURITY] ${req.id || 'unknown'} - Magic byte mismatch or missing. Declared: ${req.file.mimetype}, Found: ${fileInfo?.mime}`);
      throw new AppError('File signature validation failed. Possible spoofing detected.', StatusCodes.BAD_REQUEST, 'FILE_SPOOF_DETECTED');
    }

    next();
  } catch (error) {
    next(error);
  }
};
