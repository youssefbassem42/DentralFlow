import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { BadRequestError } from '../errors/AppError.js';

const uploadDir = path.join(process.cwd(), 'uploads', 'attachments');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, word docs, text files
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  return cb(
    new BadRequestError('Invalid file type. Allowed: images, pdf, doc, docx, txt, zip.'),
    false
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
