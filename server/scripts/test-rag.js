import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function generateTestPdf() {
  const content = 'BT /F1 24 Tf 100 700 Td (Operating Systems - Virtual Memory and Paging) Tj 0 -30 Td (Paging is a memory management scheme that divides virtual memory into pages) Tj 0 -30 Td (and physical memory into frames. The page table stores the mapping.) Tj 0 -30 Td (Page fault occurs when a requested page is not present in main memory RAM.) Tj 0 -30 Td (Translation Lookaside Buffer TLB is a fast hardware cache for page table entries.) Tj ET'
  const streamLen = content.length
  const body =
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
    '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + content + '\nendstream\nendobj\n' +
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'

  const p1 = 9
  const p2 = body.indexOf('2 0 obj')
  const p3 = body.indexOf('3 0 obj')
  const p4 = body.indexOf('4 0 obj')
  const p5 = body.indexOf('5 0 obj')
  const xrefOffset = body.length

  const pad = (n) => ('0000000000' + n).slice(-10)

  return (
    body +
    'xref\n' +
    '0 6\n' +
    '0000000000 65535 f \n' +
    pad(p1) + ' 00000 n \n' +
    pad(p2) + ' 00000 n \n' +
    pad(p3) + ' 00000 n \n' +
    pad(p4) + ' 00000 n \n' +
    pad(p5) + ' 00000 n \n' +
    'trailer\n' +
    '<< /Size 6 /Root 1 0 R >>\n' +
    'startxref\n' +
    xrefOffset + '\n' +
    '%%EOF'
  )
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'scholarsense' })
  const user = await mongoose.connection.collection('users').findOne({})
  const subject = await mongoose.connection.collection('subjects').findOne({ userId: user._id })
  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })

  console.log('Testing PDF Assistant RAG pipeline for user:', user.email)

  const tempFilePath = path.join(__dirname, 'test-notes.pdf')
  fs.writeFileSync(tempFilePath, generateTestPdf())

  const formData = new FormData()
  const blob = new Blob([fs.readFileSync(tempFilePath)], { type: 'application/pdf' })
  formData.append('file', blob, 'OS_Paging_Notes.pdf')
  formData.append('title', 'Operating Systems Virtual Memory and Paging')
  if (subject) formData.append('subjectId', subject._id.toString())

  console.log('Uploading PDF to http://127.0.0.1:5000/api/documents/upload ...')
  const uploadRes = await fetch('http://127.0.0.1:5000/api/documents/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: formData,
  })

  const uploadData = await uploadRes.json()
  console.log('Upload status:', uploadRes.status, 'Response:', JSON.stringify(uploadData))
  console.log('Document ID:', uploadData.data?._id, 'Status:', uploadData.data?.status, 'Chunks:', uploadData.data?.totalChunks)
  console.log('Summary:', uploadData.data?.summary)

  if (uploadData.success && uploadData.data?._id) {
    const docId = uploadData.data._id

    console.log('\nAsking grounded question: "What is a page fault and what is TLB?"')
    const askRes = await fetch('http://127.0.0.1:5000/api/documents/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        question: 'What is a page fault and what role does TLB play according to these notes?',
        documentId: docId,
      }),
    })

    const askData = await askRes.json()
    console.log('Ask status:', askRes.status, 'Response:', JSON.stringify(askData))
    console.log('Citations count:', askData.data?.citations?.length)
    console.log('\nAI Grounded Answer:\n' + askData.data?.answer)

    console.log('\nCleaning up test document...')
    const delRes = await fetch('http://127.0.0.1:5000/api/documents/' + docId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    })
    console.log('Delete status:', delRes.status)
  }

  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
  await mongoose.disconnect()
}

run().catch((e) => console.error(e))
