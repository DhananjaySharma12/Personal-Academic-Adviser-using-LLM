/**
 * rag.service.js — RAG grounded question answering with citations and multi-model fallback.
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

const MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-pro-latest',
]

/**
 * Generates an answer to a question grounded in retrieved document chunks.
 * @param {string} question
 * @param {Array<{ content: string, pageNumber: number, documentTitle?: string, score?: number }>} chunks
 * @param {object} studentContext
 * @returns {Promise<{ answer: string, citations: Array<{ documentTitle: string, pageNumber: number, snippet: string }> }>}
 */
export async function answerWithRag(question, chunks = [], studentContext = {}) {
  const client = getClient()

  if (!chunks || chunks.length === 0) {
    return {
      answer: "I couldn't find any relevant passages in the selected document to answer your question. Please ensure the document contains relevant topics or try rephrasing your query.",
      citations: [],
    }
  }

  // Format context passages with citations
  const contextText = chunks
    .map(
      (c, i) =>
        `--- EXCERPT ${i + 1} [Document: "${c.documentTitle || 'Document'}", Page ${c.pageNumber || 1}] ---\n${c.content}`
    )
    .join('\n\n')

  const prompt = `You are "Personal Academic Adviser — PDF Assistant".
Your task is to answer the student's question accurately and thoroughly, GROUNDED STRICTLY in the provided document excerpts.

### RETRIEVED DOCUMENT EXCERPTS:
${contextText}

### STUDENT'S QUESTION:
${question}

### INSTRUCTIONS:
1. Ground your answer in the provided excerpts.
2. Whenever citing a fact, concept, definition, theorem, or method, include an inline citation badge: [Doc: "${chunks[0]?.documentTitle || 'Doc'}", Page X].
3. If the excerpts do not contain sufficient information to answer the question, explain clearly what information was found and what is missing. Do not invent facts or cite external unverifiable details.
4. Format your answer with clean Markdown (bold key terms, use bullet points, numbered steps, or code blocks where appropriate).
5. At the very end of your response, include a brief "### 📌 Key Citations" section listing the pages and topics referenced.`

  let lastError = null
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const answer = result.response.text()

      // Format citations array for UI badge display
      const citations = chunks.map((c) => ({
        documentTitle: c.documentTitle || 'Document',
        pageNumber: c.pageNumber || 1,
        snippet: c.content.slice(0, 160) + '...',
      }))

      return {
        answer,
        citations,
      }
    } catch (err) {
      console.warn(`[rag.service fallback] Model ${modelName} failed: ${err.message}. Trying next candidate...`)
      lastError = err
    }
  }

  throw lastError || new Error('All model candidates failed for RAG answering')
}

/**
 * Generates a concise 1-2 sentence academic summary of an uploaded document.
 * @param {string} textSample
 * @param {string} title
 * @returns {Promise<string>}
 */
export async function summarizeDocument(textSample, title) {
  const client = getClient()
  const sample = textSample.slice(0, 3000)

  const prompt = `Briefly summarize what this academic document is about in 1-2 concise sentences for a student dashboard. Focus on the core subject, topic, and academic purpose:
Document Title: ${title}
Content Sample:
${sample}

Keep the summary under 200 characters.`

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      if (text) return text
    } catch (err) {
      console.warn(`[rag.service summary fallback] Model ${modelName} failed: ${err.message}`)
    }
  }

  return `Academic notes and reference material on ${title}.`
}
