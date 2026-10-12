/**
 * documents.js — API client for PDF Assistant & RAG.
 */
import { apiClient } from './client'

export const documentsApi = {
  getDocuments: (params) =>
    apiClient.get('/documents', { params }).then((r) => r.data.data),

  getDocumentById: (id) =>
    apiClient.get(`/documents/${id}`).then((r) => r.data.data),

  uploadDocument: (formData, onProgress) =>
    apiClient
      .post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data.data),

  deleteDocument: (id) =>
    apiClient.delete(`/documents/${id}`).then((r) => r.data),

  askDocument: ({ question, documentId, subjectId }) =>
    apiClient
      .post('/documents/ask', { question, documentId, subjectId })
      .then((r) => r.data.data),
}
