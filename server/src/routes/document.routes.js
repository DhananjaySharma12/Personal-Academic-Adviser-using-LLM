/**
 * document.routes.js — Routes for PDF upload, retrieval, and RAG Q&A.
 */
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { authenticate } from '../middleware/authenticate.js'
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  askDocument,
} from '../controllers/document.controller.js'
import { storageService } from '../services/storage/local.storage.js'
import { env } from '../config/env.js'
import { badRequest } from '../utils/ApiError.js'

const router = Router()

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.getUploadDir())
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf'
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
    cb(null, `doc-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    cb(null, true)
  } else {
    cb(badRequest('Only PDF files are supported'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024, // 10MB
  },
})

// All routes require authentication
router.use(authenticate)

// Document CRUD & Upload
router.post('/upload', upload.single('file'), uploadDocument)
router.post('/', upload.single('file'), uploadDocument)
router.get('/', getDocuments)
router.get('/:id', getDocumentById)
router.delete('/:id', deleteDocument)

// RAG Q&A
router.post('/ask', askDocument)
router.post('/:id/ask', (req, res, next) => {
  req.body.documentId = req.params.id
  return askDocument(req, res, next)
})

export default router
