/**
 * document.controller.js — Handles PDF upload, chunking, indexing, retrieval, and RAG Q&A.
 */
import fs from 'fs'
import path from 'path'
import Document from '../models/Document.js'
import DocumentChunk from '../models/DocumentChunk.js'
import Subject from '../models/Subject.js'
import StudentProfile from '../models/StudentProfile.js'
import { parsePdf, chunkText } from '../services/ai/pdfParser.service.js'
import { getEmbedding, rankChunks } from '../services/vectorstore/vectorStore.service.js'
import { answerWithRag, summarizeDocument } from '../services/ai/rag.service.js'
import { storageService } from '../services/storage/local.storage.js'
import { ok, created, noContent } from '../utils/response.js'
import { badRequest, notFound, forbidden } from '../utils/ApiError.js'

/**
 * POST /api/documents/upload
 * Handles multipart file upload (PDF), text extraction, chunking, and embedding.
 */
export async function uploadDocument(req, res, next) {
  try {
    const file = req.file
    if (!file) {
      throw badRequest('Please select a PDF file to upload')
    }

    const userId = req.user.id
    const subjectId = req.body.subjectId || null
    const title = req.body.title?.trim() || file.originalname.replace(/\.[^/.]+$/, '')

    // Verify subject ownership if subjectId is provided
    if (subjectId) {
      const subject = await Subject.findOne({ _id: subjectId, userId })
      if (!subject) throw badRequest('Selected subject not found')
    }

    // Read file buffer and parse PDF
    const fileBuffer = fs.readFileSync(file.path)
    let parsed
    try {
      parsed = await parsePdf(fileBuffer)
    } catch (parseErr) {
      storageService.deleteFile(file.path)
      throw badRequest('Failed to extract text from PDF. The file may be password-protected or corrupted.')
    }

    const { text, numPages } = parsed
    if (!text || text.trim().length === 0) {
      storageService.deleteFile(file.path)
      throw badRequest('No readable text found in PDF. Scanned images without OCR are not supported.')
    }

    // Create Document record
    const doc = await Document.create({
      userId,
      subjectId,
      title,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageCount: numPages || 1,
      status: 'processing',
    })

    // Chunk the text
    const chunks = chunkText(text, numPages || 1, { chunkSize: 750, chunkOverlap: 120 })

    // Generate embeddings in parallel batches of 5 to avoid rate-limiting
    const chunkDocs = []
    const batchSize = 5

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddingPromises = batch.map(async (c) => {
        const embedding = await getEmbedding(c.content)
        return {
          documentId: doc._id,
          userId,
          subjectId,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          content: c.content,
          embedding,
        }
      })
      const resolvedBatch = await Promise.all(embeddingPromises)
      chunkDocs.push(...resolvedBatch)
    }

    if (chunkDocs.length > 0) {
      await DocumentChunk.insertMany(chunkDocs)
    }

    // Generate quick summary
    const summary = await summarizeDocument(text, title)

    // Update document status
    doc.status = 'ready'
    doc.totalChunks = chunkDocs.length
    doc.summary = summary
    await doc.save()

    const populated = await Document.findById(doc._id).populate('subjectId', 'name code color')
    created(res, populated)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/documents
 * List all documents uploaded by the authenticated student.
 */
export async function getDocuments(req, res, next) {
  try {
    const userId = req.user.id
    const { subjectId } = req.query

    const filter = { userId }
    if (subjectId) {
      filter.subjectId = subjectId
    }

    const documents = await Document.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ createdAt: -1 })

    ok(res, documents)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/documents/:id
 * Retrieve a specific document by ID along with its chunk previews.
 */
export async function getDocumentById(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const document = await Document.findOne({ _id: id, userId }).populate('subjectId', 'name code color')
    if (!document) {
      throw notFound('Document not found')
    }

    const chunks = await DocumentChunk.find({ documentId: id, userId })
      .select('chunkIndex pageNumber content')
      .sort({ chunkIndex: 1 })
      .limit(50)

    ok(res, { document, chunks })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/documents/:id
 * Delete a document, its chunks, and its file from disk.
 */
export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const document = await Document.findOne({ _id: id, userId })
    if (!document) {
      throw notFound('Document not found')
    }

    // Delete file from disk
    storageService.deleteFile(document.filePath)

    // Delete chunks and document from database
    await Promise.all([
      DocumentChunk.deleteMany({ documentId: id }),
      Document.deleteOne({ _id: id }),
    ])

    noContent(res)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/documents/ask
 * Ask a question grounded in an uploaded document (or subject documents).
 */
export async function askDocument(req, res, next) {
  try {
    const { question, documentId, subjectId } = req.body
    if (!question || !question.trim()) {
      throw badRequest('Please provide a question to ask')
    }

    const userId = req.user.id

    // Build filter for chunks
    const chunkFilter = { userId }
    let targetDocTitle = 'Document'

    if (documentId) {
      const doc = await Document.findOne({ _id: documentId, userId })
      if (!doc) throw notFound('Document not found')
      chunkFilter.documentId = documentId
      targetDocTitle = doc.title
    } else if (subjectId) {
      chunkFilter.subjectId = subjectId
      const subject = await Subject.findOne({ _id: subjectId, userId })
      if (subject) targetDocTitle = `${subject.name} Notes`
    }

    // Fetch chunks
    const allChunks = await DocumentChunk.find(chunkFilter)
      .populate('documentId', 'title')
      .lean()

    if (!allChunks || allChunks.length === 0) {
      return ok(res, {
        answer: "No document excerpts found for this query. Please upload notes or select a document first.",
        citations: [],
      })
    }

    // Format chunks with document title
    const formattedChunks = allChunks.map((c) => ({
      ...c,
      documentTitle: c.documentId?.title || targetDocTitle,
    }))

    // Generate query embedding
    const queryEmbedding = await getEmbedding(question)

    // Rank and pick top 4-5 most relevant chunks
    const relevantChunks = rankChunks(queryEmbedding, question, formattedChunks, 5)

    // Student profile context
    const profile = await StudentProfile.findOne({ userId }).lean()

    // Generate grounded RAG answer
    const { answer, citations } = await answerWithRag(question, relevantChunks, { profile })

    ok(res, {
      answer,
      citations,
      sourcesCount: relevantChunks.length,
      relevantSnippets: relevantChunks.map((c) => ({
        documentTitle: c.documentTitle,
        pageNumber: c.pageNumber,
        score: Math.round((c.score || 0) * 100),
        snippet: c.content.slice(0, 200),
      })),
    })
  } catch (err) {
    next(err)
  }
}
