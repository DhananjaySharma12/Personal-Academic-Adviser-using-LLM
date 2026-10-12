/**
 * DocumentChunk.js — Model for chunked passages of student documents with vector embeddings.
 */
import mongoose from 'mongoose'

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
)

// Compound index for fast retrieval per document
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 })
// Index for subject-wide RAG search
documentChunkSchema.index({ userId: 1, subjectId: 1 })

export default mongoose.model('DocumentChunk', documentChunkSchema)
