/**
 * vectorStore.service.js — Generates embeddings and performs semantic cosine similarity search.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/env.js'

let genAI = null

function getClient() {
  if (!genAI) {
    if (!env.LLM_API_KEY) {
      throw new Error('LLM_API_KEY is not configured in server environment')
    }
    genAI = new GoogleGenerativeAI(env.LLM_API_KEY)
  }
  return genAI
}

/**
 * Generate embedding vector using Gemini or fallback term-frequency vector.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  const clean = text.slice(0, 4000).trim()
  if (!clean) return []

  try {
    const client = getClient()
    const model = client.getGenerativeModel({ model: env.EMBEDDING_MODEL || 'gemini-embedding-001' })
    const result = await model.embedContent(clean)
    if (result?.embedding?.values && result.embedding.values.length > 0) {
      return result.embedding.values
    }
  } catch (err) {
    console.warn('[vectorStore] Gemini embedding failed, using local hash vector fallback:', err.message)
  }

  // Fallback: 256-dimensional deterministic hash vector
  return createFallbackVector(clean, 256)
}

/**
 * Creates a deterministic normalized n-gram term vector as resilient offline fallback.
 */
function createFallbackVector(text, dimensions = 256) {
  const vec = new Array(dimensions).fill(0)
  const words = text.toLowerCase().split(/\W+/).filter(Boolean)

  for (const word of words) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) % dimensions
    }
    vec[Math.abs(hash)] += 1
  }

  // Normalize
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
  if (magnitude === 0) return vec
  return vec.map((v) => v / magnitude)
}

/**
 * Computes cosine similarity between two float vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Searches and ranks document chunks based on semantic similarity + keyword boost.
 * @param {number[]} queryEmbedding
 * @param {string} queryText
 * @param {Array<{ content: string, embedding: number[], pageNumber: number, chunkIndex: number }>} chunks
 * @param {number} topK
 */
export function rankChunks(queryEmbedding, queryText, chunks, topK = 4) {
  const queryTerms = queryText.toLowerCase().split(/\W+/).filter((w) => w.length > 2)

  const scored = chunks.map((chunk) => {
    let similarity = 0
    if (queryEmbedding && chunk.embedding && queryEmbedding.length === chunk.embedding.length) {
      similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
    }

    // Keyword boost (up to +0.25 bonus for matching essential terms)
    let keywordMatches = 0
    const lowerContent = chunk.content.toLowerCase()
    for (const term of queryTerms) {
      if (lowerContent.includes(term)) {
        keywordMatches++
      }
    }
    const keywordBoost = queryTerms.length > 0 ? (keywordMatches / queryTerms.length) * 0.25 : 0

    return {
      chunk,
      score: similarity + keywordBoost,
      similarity,
      keywordMatches,
    }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topK).map((item) => ({
    ...item.chunk,
    score: item.score,
    similarity: item.similarity,
  }))
}
