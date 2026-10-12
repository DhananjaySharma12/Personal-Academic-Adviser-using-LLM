/**
 * DocumentsPage.jsx — PDF Assistant (RAG)
 * Upload lecture notes, syllabi, textbooks, and ask grounded questions with page citations.
 */
import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Upload,
  Search,
  Sparkles,
  BookOpen,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Copy,
  Check,
  X,
  Eye,
  FileQuestion,
  CornerDownRight,
  Calendar,
} from 'lucide-react'
import { documentsApi } from '@/api/documents'
import { getSubjects } from '@/api/subjects'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  // State
  const [selectedSubjectId, setSelectedSubjectId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDocForQa, setActiveDocForQa] = useState(null) // null = all documents mode
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState([])
  const [isAsking, setIsAsking] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSubjectId, setUploadSubjectId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Excerpts viewer modal state
  const [viewingDocId, setViewingDocId] = useState(null)

  // Queries
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getDocuments(),
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  })

  const { data: viewingDocData, isLoading: isLoadingDocDetails } = useQuery({
    queryKey: ['document', viewingDocId],
    queryFn: () => documentsApi.getDocumentById(viewingDocId),
    enabled: !!viewingDocId,
  })

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (formData) =>
      documentsApi.uploadDocument(formData, (e) => {
        if (e.total) {
          setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      }),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      addToast(`"${newDoc.title}" processed & indexed!`, 'success')
      setIsUploadOpen(false)
      setUploadFile(null)
      setUploadTitle('')
      setUploadSubjectId('')
      setUploadProgress(0)
      setActiveDocForQa(newDoc)
    },
    onError: (err) => {
      addToast(err.message || 'Failed to upload and index document', 'error')
      setUploadProgress(0)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => documentsApi.deleteDocument(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      addToast('Document deleted', 'info')
      if (activeDocForQa?._id === deletedId) {
        setActiveDocForQa(null)
      }
      if (viewingDocId === deletedId) {
        setViewingDocId(null)
      }
    },
    onError: (err) => {
      addToast(err.message || 'Failed to delete document', 'error')
    },
  })

  // Handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type === 'application/pdf') {
      setUploadFile(file)
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    } else {
      addToast('Please upload a PDF file', 'error')
    }
  }, [uploadTitle, addToast])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        addToast('Please upload a PDF file', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('File size must be under 10MB', 'error')
        return
      }
      setUploadFile(file)
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleStartUpload = (e) => {
    e.preventDefault()
    if (!uploadFile) {
      addToast('Please select a file to upload', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadFile)
    if (uploadTitle) formData.append('title', uploadTitle)
    if (uploadSubjectId) formData.append('subjectId', uploadSubjectId)

    setUploadProgress(10)
    uploadMutation.mutate(formData)
  }

  const handleAskQuestion = async (presetQuestion) => {
    const q = (presetQuestion || qaQuestion).trim()
    if (!q || isAsking) return

    setIsAsking(true)
    setQaQuestion('')

    // Append user question
    const currentEntry = {
      question: q,
      targetDocTitle: activeDocForQa?.title || 'All Uploaded Notes',
      answer: null,
      citations: [],
      relevantSnippets: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setQaHistory((prev) => [...prev, currentEntry])

    try {
      const payload = {
        question: q,
        documentId: activeDocForQa?._id || undefined,
        subjectId: selectedSubjectId !== 'all' ? selectedSubjectId : undefined,
      }
      const response = await documentsApi.askDocument(payload)

      setQaHistory((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last) {
          last.answer = response.answer
          last.citations = response.citations || []
          last.relevantSnippets = response.relevantSnippets || []
        }
        return copy
      })
    } catch (err) {
      setQaHistory((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last) {
          last.answer = `⚠️ Error: ${err.message || 'Could not retrieve answer from document.'}`
        }
        return copy
      })
    } finally {
      setIsAsking(false)
    }
  }

  const handleCopyAnswer = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
    addToast('Answer copied to clipboard!', 'info')
  }

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSubject =
      selectedSubjectId === 'all' || doc.subjectId?._id === selectedSubjectId
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subjectId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSubject && matchesSearch
  })

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const PRESET_QUESTIONS = [
    'What are the core concepts and definitions covered in this material?',
    'Summarize the key formulas, theorems, and mechanisms step by step.',
    'What are the most likely exam questions based on this document?',
    'Explain the most challenging topic in these notes with simple analogies.',
  ]

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-card p-6 sm:p-8"
        style={{
          background: 'linear-gradient(145deg, #84A282 0%, #6B8F69 60%, #5E7A5C 100%)',
          border: '1px solid rgba(184, 207, 179, 0.40)',
          boxShadow: '0 4px 24px rgba(132, 162, 130, 0.30)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #FEFAF3, transparent)' }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'rgba(254,250,243,0.20)' }}>
                <Sparkles size={11} style={{ color: '#FEFAF3' }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(254,250,243,0.80)' }}>
                Ground Truth Study Assistant
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold md:text-3xl" style={{ color: '#FEFAF3' }}>
              PDF Assistant (RAG)
            </h1>
            <p className="text-xs sm:text-sm max-w-xl" style={{ color: 'rgba(254,250,243,0.75)' }}>
              Upload your lecture notes, textbook chapters, and syllabus PDFs. Ask questions and get precise,
              fact-checked answers backed by exact page citations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="btn-accent flex items-center gap-2"
            >
              <Upload size={16} />
              Upload PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Documents Grid + RAG Q&A Workspace ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Documents Browser (7 Cols) ──────────────────── */}
        <div className="lg:col-span-7 space-y-4">

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: '#7A6858' }}
              />
              <input
                type="text"
                placeholder="Search notes, chapters, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-xs"
              />
            </div>

            {/* Subject selector */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input sm:w-44 text-xs cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code || 'Course'})
                </option>
              ))}
            </select>
          </div>

          {/* Documents List */}
          {isLoadingDocs ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-card" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div
              className="card p-10 text-center space-y-3"
              style={{ background: '#FFFFFF', borderColor: 'rgba(132, 162, 130, 0.25)', boxShadow: '0 2px 16px rgba(132,162,130,0.08)' }}
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(132, 162, 130, 0.15)', border: '1px solid rgba(132, 162, 130, 0.30)' }}
              >
                <FileText size={24} style={{ color: '#84A282' }} />
              </div>
              <h3 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>
                {searchQuery || selectedSubjectId !== 'all' ? 'No matching documents' : 'No documents uploaded yet'}
              </h3>
              <p className="text-xs max-w-sm mx-auto" style={{ color: '#7A8E79' }}>
                Upload your lecture slides, syllabus, or textbook PDFs to start asking grounded AI questions.
              </p>
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="mt-2"
              >
                Upload First PDF
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const isSelectedForQa = activeDocForQa?._id === doc._id
                const subjectColor = doc.subjectId?.color || '#84A282'

                return (
                  <div
                    key={doc._id}
                    className="card p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:shadow-card-hover flex flex-col justify-between gap-3 group"
                    style={{
                      background: isSelectedForQa
                        ? 'rgba(132, 162, 130, 0.08)'
                        : '#FFFFFF',
                      borderColor: isSelectedForQa
                        ? '#84A282'
                        : 'rgba(132, 162, 130, 0.22)',
                      borderLeft: `4px solid ${subjectColor}`,
                      boxShadow: isSelectedForQa
                        ? '0 0 20px rgba(132, 162, 130, 0.20)'
                        : '0 2px 12px rgba(132, 162, 130, 0.06)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.subjectId && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(184, 207, 179, 0.25)',
                                color: '#4A5E49',
                                border: '1px solid rgba(132, 162, 130, 0.35)',
                              }}
                            >
                              {doc.subjectId.code || doc.subjectId.name}
                            </span>
                          )}
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: doc.status === 'ready' ? 'rgba(132, 162, 130, 0.18)' : 'rgba(196, 149, 106, 0.18)',
                              color: doc.status === 'ready' ? '#5E7A5C' : '#8B5E3A',
                            }}
                          >
                            {doc.status === 'ready' ? 'Indexed & Ready' : 'Processing...'}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold truncate" style={{ color: '#2D3A2C' }}>
                          {doc.title}
                        </h3>

                        {doc.summary && (
                          <p className="text-xs line-clamp-2" style={{ color: '#4A5E49' }}>
                            {doc.summary}
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${doc.title}" and its indexed excerpts?`)) {
                            deleteMutation.mutate(doc._id)
                          }
                        }}
                        className="opacity-60 hover:opacity-100 p-1.5 rounded-lg transition-colors hover:bg-danger/10 text-danger shrink-0"
                        title="Delete document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
                      style={{ borderColor: 'rgba(132, 162, 130, 0.15)' }}
                    >
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: '#7A8E79' }}>
                        <span>{doc.pageCount || 1} pages</span>
                        <span>•</span>
                        <span>{doc.totalChunks || 0} excerpts</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingDocId(doc._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{
                            background: '#F5F0E8',
                            color: '#4A5E49',
                            border: '1px solid rgba(132, 162, 130, 0.25)',
                          }}
                        >
                          <Eye size={13} />
                          Excerpts
                        </button>

                        <button
                          onClick={() => setActiveDocForQa(isSelectedForQa ? null : doc)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-btn transition-all"
                          style={{
                            background: isSelectedForQa ? '#5E7A5C' : '#84A282',
                            color: '#FEFAF3',
                            border: '1px solid #84A282',
                            boxShadow: '0 0 12px rgba(132, 162, 130, 0.30)',
                          }}
                        >
                          <Sparkles size={13} style={{ color: '#FEFAF3' }} />
                          {isSelectedForQa ? 'Active in Q&A' : 'Ask AI'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Interactive RAG Q&A Workspace (5 Cols) ─────── */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="card p-5 relative overflow-hidden flex flex-col h-full min-h-[560px]"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(132, 162, 130, 0.25)',
              boxShadow: '0 4px 24px rgba(132, 162, 130, 0.10)',
            }}
          >
            {/* Header / Active Target Indicator */}
            <div className="pb-3 border-b space-y-1.5" style={{ borderColor: 'rgba(132, 162, 130, 0.18)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(132, 162, 130, 0.20)', color: '#84A282' }}
                  >
                    <Sparkles size={14} />
                  </div>
                  <h2 className="font-display text-sm font-bold" style={{ color: '#2D3A2C' }}>
                    Document Q&A Assistant
                  </h2>
                </div>

                {activeDocForQa && (
                  <button
                    onClick={() => setActiveDocForQa(null)}
                    className="text-[10px] text-accent hover:underline font-medium"
                  >
                    Reset to All Notes
                  </button>
                )}
              </div>

              {/* Scope badge */}
              <div
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg"
                style={{
                  background: activeDocForQa ? 'rgba(132, 162, 130, 0.12)' : 'rgba(184, 207, 179, 0.25)',
                  color: '#4A5E49',
                  border: '1px solid rgba(132, 162, 130, 0.30)',
                }}
              >
                <BookOpen size={12} style={{ color: '#84A282' }} />
                <span className="font-semibold truncate">
                  Scope: {activeDocForQa ? activeDocForQa.title : 'All Uploaded Subject Notes'}
                </span>
              </div>
            </div>

            {/* Conversation / Answer Scroll Area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {qaHistory.length === 0 ? (
                <div className="py-6 text-center space-y-3">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(132, 162, 130, 0.15)' }}
                  >
                    <FileQuestion size={22} style={{ color: '#84A282' }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: '#2D3A2C' }}>
                    Ask anything about your notes
                  </p>
                  <p className="text-[11px] max-w-xs mx-auto" style={{ color: '#7A8E79' }}>
                    Gemini retrieves the exact matching page excerpts and writes fact-checked answers with citations.
                  </p>

                  {/* Preset prompts */}
                  <div className="pt-2 space-y-1.5 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7A8E79' }}>
                      Suggested Questions:
                    </p>
                    {PRESET_QUESTIONS.map((pq, i) => (
                      <button
                        key={i}
                        onClick={() => handleAskQuestion(pq)}
                        className="w-full text-left text-[11px] p-2.5 rounded-xl border transition-all hover:scale-[1.01] block"
                        style={{
                          background: '#FEFAF3',
                          borderColor: 'rgba(132, 162, 130, 0.25)',
                          color: '#4A5E49',
                          boxShadow: '0 1px 4px rgba(132, 162, 130, 0.05)',
                        }}
                      >
                        <span className="font-medium" style={{ color: '#2D3A2C' }}>
                          💡 {pq}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                qaHistory.map((entry, idx) => (
                  <div key={idx} className="space-y-3">
                    {/* Question */}
                    <div className="flex justify-end">
                      <div
                        className="rounded-2xl rounded-tr-sm p-3 text-xs max-w-[90%]"
                        style={{
                          background: 'rgba(132, 162, 130, 0.18)',
                          color: '#2D3A2C',
                          border: '1px solid rgba(132, 162, 130, 0.35)',
                        }}
                      >
                        <p className="font-medium">{entry.question}</p>
                        <p className="text-[9px] mt-1 text-right" style={{ color: '#7A8E79' }}>
                          {entry.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="flex justify-start">
                      <div
                        className="rounded-2xl rounded-tl-sm p-3.5 text-xs max-w-[95%] space-y-2"
                        style={{
                          background: '#F5F0E8',
                          color: '#2D3A2C',
                          border: '1px solid rgba(132, 162, 130, 0.22)',
                          boxShadow: '0 2px 8px rgba(132, 162, 130, 0.06)',
                        }}
                      >
                        {entry.answer ? (
                          <>
                            <div className="prose max-w-none text-xs leading-relaxed space-y-2" style={{ color: '#2D3A2C' }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {entry.answer}
                              </ReactMarkdown>
                            </div>

                            {/* Citations Badges */}
                            {entry.citations?.length > 0 && (
                              <div
                                className="pt-2.5 border-t mt-3 space-y-1.5"
                                style={{ borderColor: 'rgba(132, 162, 130, 0.20)' }}
                              >
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5E7A5C' }}>
                                  Verified Source Pages:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {entry.citations.map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                                      style={{
                                        background: 'rgba(246, 226, 233, 0.65)',
                                        color: '#8B4A5E',
                                        border: '1px solid rgba(246, 226, 233, 0.85)',
                                      }}
                                      title={c.snippet}
                                    >
                                      📄 Page {c.pageNumber} ({c.documentTitle})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Copy button */}
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleCopyAnswer(entry.answer, idx)}
                                className="flex items-center gap-1 text-[10px] transition-colors"
                                style={{ color: '#7A8E79' }}
                              >
                                {copiedIdx === idx ? (
                                  <>
                                    <Check size={11} className="text-success" />
                                    <span className="text-success font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy answer</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 py-2" style={{ color: '#7A8E79' }}>
                            <Loader2 size={15} className="animate-spin text-accent" />
                            <span className="text-xs">
                              Searching excerpts & generating grounded answer...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(132, 162, 130, 0.20)' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAskQuestion()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    activeDocForQa
                      ? `Ask a question about "${activeDocForQa.title}"...`
                      : 'Ask a question across all your notes...'
                  }
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  disabled={isAsking}
                  className="input text-xs flex-1"
                />
                <button
                  type="submit"
                  disabled={isAsking || !qaQuestion.trim()}
                  className="btn-accent p-2.5 rounded-btn shrink-0 disabled:opacity-40"
                  title="Send question"
                >
                  {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>

      {/* ── Upload Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => {
          if (!uploadMutation.isPending) setIsUploadOpen(false)
        }}
        title="Upload Academic Document (PDF)"
      >
        <form onSubmit={handleStartUpload} className="space-y-4">

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-card p-6 text-center transition-all cursor-pointer ${
              isDragging ? 'border-accent bg-accent/10' : 'border-border-strong hover:border-accent/40 bg-raised/40'
            }`}
            onClick={() => document.getElementById('pdf-file-input')?.click()}
          >
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-3"
              style={{ background: 'rgba(132,162,130,0.18)' }}
            >
              <Upload size={22} style={{ color: '#84A282' }} />
            </div>

            {uploadFile ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#2D3A2C' }}>
                  {uploadFile.name}
                </p>
                <p className="text-[11px]" style={{ color: '#7A8E79' }}>
                  {formatFileSize(uploadFile.size)} • Click to change
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: '#2D3A2C' }}>
                  Drag and drop your PDF here, or click to browse
                </p>
                <p className="text-[11px]" style={{ color: '#7A8E79' }}>
                  Syllabi, textbook chapters, class notes (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#4A5E49' }}>
              Document Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Operating Systems Unit 3 Paging Notes"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              required
            />
          </div>

          {/* Subject tag */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: '#4A5E49' }}>
              Associated Course / Subject (Optional)
            </label>
            <select
              value={uploadSubjectId}
              onChange={(e) => setUploadSubjectId(e.target.value)}
              className="input text-xs"
            >
              <option value="">General / No Specific Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code || 'Course'})
                </option>
              ))}
            </select>
          </div>

          {/* Upload Progress Bar */}
          {uploadMutation.isPending && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: '#7A8E79' }}>
                  Extracting text & generating vector embeddings...
                </span>
                <span className="font-semibold" style={{ color: '#84A282' }}>
                  {uploadProgress}%
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full overflow-hidden"
                style={{ background: 'rgba(132,162,130,0.15)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(10, uploadProgress)}%`,
                    background: 'linear-gradient(90deg, #84A282 0%, #B8CFB3 100%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploadMutation.isPending}
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!uploadFile || uploadMutation.isPending}
              className="btn-accent flex items-center gap-2"
            >
              {uploadMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {uploadMutation.isPending ? 'Processing...' : 'Upload & Index'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Excerpts Viewer Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!viewingDocId}
        onClose={() => setViewingDocId(null)}
        title={viewingDocData?.document?.title || 'Document Excerpts'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {isLoadingDocDetails ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : viewingDocData?.chunks?.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: '#7A8E79' }}>
              No text chunks parsed for this document.
            </p>
          ) : (
            <div className="space-y-3">
              <div
                className="p-3 rounded-xl border text-xs"
                style={{
                  background: '#F5F0E8',
                  borderColor: 'rgba(132,162,130,0.20)',
                  color: '#4A5E49',
                }}
              >
                <p className="font-semibold" style={{ color: '#2D3A2C' }}>
                  {viewingDocData?.document?.pageCount || 1} Pages • {viewingDocData?.chunks?.length} Indexed Passages
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#7A8E79' }}>
                  {viewingDocData?.document?.summary}
                </p>
              </div>

              {viewingDocData?.chunks?.map((chunk, idx) => (
                <div
                  key={idx}
                  className="card-raised p-3.5 space-y-1.5 text-xs rounded-xl border"
                  style={{ borderColor: 'rgba(132,162,130,0.20)', background: '#FFFFFF' }}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wider" style={{ color: '#5E7A5C' }}>
                      Excerpt #{chunk.chunkIndex + 1} • Page {chunk.pageNumber}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#4A5E49' }}>
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

    </div>
  )
}
