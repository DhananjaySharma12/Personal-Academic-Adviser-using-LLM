/**
 * pdfParser.service.js — Extracts text from PDF files and splits into semantically coherent overlapping chunks.
 * Uses official pdf-parse with fallback stream text extraction for resilient parsing.
 */
import pdfParse from 'pdf-parse'

/**
 * Extracts raw text and page count from a PDF buffer.
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string, numPages: number, info: object }>}
 */
export async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer)
    if (data?.text && data.text.trim().length > 0) {
      return {
        text: data.text,
        numPages: data.numpages || 1,
        info: data.info || {},
      }
    }
  } catch (err) {
    console.warn('[pdfParser] Primary pdf-parse failed, attempting stream extraction fallback:', err.message)
  }

  // Fallback: extract text from raw PDF streams & text operators (BT ... ET, (text) Tj / TJ)
  const fallbackText = extractTextFromRawPdfBuffer(buffer)
  if (fallbackText && fallbackText.trim().length > 0) {
    // Estimate page count based on /Type /Page occurrences
    const pageMatches = buffer.toString('latin1').match(/\/Type\s*\/Page\b/g)
    const numPages = pageMatches ? pageMatches.length : 1
    return {
      text: fallbackText,
      numPages,
      info: { method: 'stream-fallback' },
    }
  }

  throw new Error('Could not extract readable text from PDF. The document may be an image scan or corrupted.')
}

/**
 * Fallback parser for extracting text streams directly from PDF bytecode.
 */
function extractTextFromRawPdfBuffer(buffer) {
  const raw = buffer.toString('latin1')
  const textParts = []

  // Extract from standard PDF text operators: (string) Tj
  const tjMatches = raw.matchAll(/\(([^)]+)\)\s*T[jJ]/g)
  for (const match of tjMatches) {
    if (match[1] && match[1].trim()) {
      textParts.push(match[1].trim())
    }
  }

  // Extract from text arrays: [(str) 20 (str2)] TJ
  const arrayMatches = raw.matchAll(/\[(.*?)\]\s*TJ/g)
  for (const match of arrayMatches) {
    const subMatches = match[1].matchAll(/\(([^)]+)\)/g)
    const line = [...subMatches].map((m) => m[1]).join(' ')
    if (line.trim()) {
      textParts.push(line.trim())
    }
  }

  return textParts.join('\n\n')
}

/**
 * Splits extracted text into overlapping chunks with estimated page numbering.
 * @param {string} fullText
 * @param {number} totalPages
 * @param {object} options
 * @returns {Array<{ chunkIndex: number, pageNumber: number, content: string }>}
 */
export function chunkText(fullText, totalPages = 1, options = {}) {
  const { chunkSize = 700, chunkOverlap = 120 } = options

  const cleaned = fullText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .trim()

  if (!cleaned) {
    return []
  }

  // Split into rough paragraph blocks
  const paragraphs = cleaned.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const chunks = []
  let currentChunk = ''
  let chunkIdx = 0

  const totalLength = cleaned.length

  for (const para of paragraphs) {
    const trimmedPara = para.trim()

    if (currentChunk.length + trimmedPara.length + 1 <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
    } else {
      if (currentChunk.trim()) {
        const estCharOffset = chunks.reduce((acc, c) => acc + c.content.length, 0)
        const estPage = Math.min(
          Math.max(1, Math.ceil((estCharOffset / Math.max(1, totalLength)) * totalPages)),
          totalPages
        )

        chunks.push({
          chunkIndex: chunkIdx++,
          pageNumber: estPage,
          content: currentChunk.trim(),
        })

        const overlapText = currentChunk.slice(-chunkOverlap)
        currentChunk = overlapText + '\n\n' + trimmedPara
      } else {
        const sentences = trimmedPara.split(/(?<=[.?!])\s+/)
        for (const sent of sentences) {
          if (currentChunk.length + sent.length + 1 <= chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sent
          } else {
            if (currentChunk.trim()) {
              const estCharOffset = chunks.reduce((acc, c) => acc + c.content.length, 0)
              const estPage = Math.min(
                Math.max(1, Math.ceil((estCharOffset / Math.max(1, totalLength)) * totalPages)),
                totalPages
              )
              chunks.push({
                chunkIndex: chunkIdx++,
                pageNumber: estPage,
                content: currentChunk.trim(),
              })
              const overlapText = currentChunk.slice(-chunkOverlap)
              currentChunk = overlapText + ' ' + sent
            } else {
              chunks.push({
                chunkIndex: chunkIdx++,
                pageNumber: 1,
                content: sent.slice(0, chunkSize),
              })
              currentChunk = ''
            }
          }
        }
      }
    }
  }

  // Remaining chunk
  if (currentChunk.trim()) {
    const estCharOffset = chunks.reduce((acc, c) => acc + c.content.length, 0)
    const estPage = Math.min(
      Math.max(1, Math.ceil((estCharOffset / Math.max(1, totalLength)) * totalPages)),
      totalPages
    )
    chunks.push({
      chunkIndex: chunkIdx++,
      pageNumber: estPage,
      content: currentChunk.trim(),
    })
  }

  return chunks
}
