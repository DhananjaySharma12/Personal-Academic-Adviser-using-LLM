/**
 * local.storage.js — File storage service for saving and deleting uploaded documents.
 */
import fs from 'fs'
import path from 'path'
import { env } from '../../config/env.js'

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

export const storageService = {
  getUploadDir() {
    return uploadDir
  },

  deleteFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
    } catch (err) {
      console.warn(`[storageService] Could not delete file ${filePath}:`, err.message)
    }
    return false
  },

  fileExists(filePath) {
    try {
      return !!(filePath && fs.existsSync(filePath))
    } catch {
      return false
    }
  },
}
