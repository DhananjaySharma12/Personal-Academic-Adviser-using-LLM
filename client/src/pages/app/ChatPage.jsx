import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Calendar,
  Layers,
  HelpCircle,
  Lightbulb,
  Loader2,
  Menu,
  Edit2,
  X,
} from 'lucide-react'
import {
  getConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  sendChatMessage,
} from '@/api/chat'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'

const STARTER_PROMPTS = [
  {
    icon: Calendar,
    title: 'Create Revision Schedule',
    prompt:
      'Please create a structured 7-day study revision plan for my enrolled courses based on my weekly study hours and goals.',
  },
  {
    icon: Layers,
    title: 'Analyze Weak Areas',
    prompt:
      'Analyze my enrolled subjects, syllabus completion rates, and assessment scores. What areas need the most focus?',
  },
  {
    icon: Lightbulb,
    title: 'Explain Difficult Topic',
    prompt:
      'Explain a difficult core concept from one of my courses using simple step-by-step logic and practical analogies.',
  },
  {
    icon: HelpCircle,
    title: 'Exam Preparation Strategy',
    prompt:
      'What are the most effective active recall and practice techniques for mastering my upcoming semester examinations?',
  },
]

export default function ChatPage() {
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()
  const { addToast } = useToast()

  const [activeId, setActiveId] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isCopied, setIsCopied] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Optimistic message placeholder
  const [optimisticUserMsg, setOptimisticUserMsg] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: conversations = [], isLoading: isLoadingList } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  // Set initial active conversation if available
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0]._id)
    }
  }, [conversations, activeId])

  const { data: activeConversation, isLoading: isLoadingActive } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => getConversationById(activeId),
    enabled: !!activeId,
  })

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages, optimisticUserMsg])

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createChatMutation = useMutation({
    mutationFn: (customTitle) =>
      createConversation({ title: (customTitle || '').trim() || 'New Chat' }),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setActiveId(newConv._id)
      setSidebarOpen(false)
      setIsNewChatModalOpen(false)
      setNewChatTitle('')
      setOptimisticUserMsg(null)
      setTimeout(() => textareaRef.current?.focus(), 100)
    },
    onError: (err) => {
      addToast(err.message || 'Failed to start new chat', 'error')
    },
  })

  const updateTitleMutation = useMutation({
    mutationFn: ({ id, title }) => updateConversation(id, { title: title.trim() }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.setQueryData(['conversation', updated._id], (old) =>
        old ? { ...old, title: updated.title } : updated,
      )
      setEditingConvId(null)
      setEditingTitle('')
      addToast('Conversation renamed', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to update title', 'error')
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: (id) => deleteConversation(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeId === deletedId) {
        const remaining = conversations.filter((c) => c._id !== deletedId)
        setActiveId(remaining[0]?._id || null)
      }
      addToast('Conversation deleted', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to delete chat', 'error')
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: (msgText) =>
      sendChatMessage({
        conversationId: activeId || undefined,
        message: msgText,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.setQueryData(['conversation', data.conversationId], data.conversation)
      if (!activeId) {
        setActiveId(data.conversationId)
      }
      setOptimisticUserMsg(null)
      setInputMessage('')
      setTimeout(scrollToBottom, 50)
    },
    onError: (err, sentMsg) => {
      setOptimisticUserMsg(null)
      setInputMessage(sentMsg) // Restore message so user doesn't lose text
      addToast(err.message || 'Failed to generate response. Please try again.', 'error')
    },
  })

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSend = (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputMessage).trim()
    if (!text || sendMessageMutation.isPending) return

    setOptimisticUserMsg(text)
    setInputMessage('')
    sendMessageMutation.mutate(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setIsCopied(idx)
    setTimeout(() => setIsCopied(null), 2000)
  }

  const startRename = (conv) => {
    setEditingConvId(conv._id)
    setEditingTitle(conv.title)
  }

  const submitRename = (id) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null)
      return
    }
    updateTitleMutation.mutate({ id, title: editingTitle })
  }

  const currentMessages = activeConversation?.messages || []

  return (
    <div className="flex h-[calc(100vh-5.5rem)] overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(132,162,130,0.25)', background: '#FFFFFF', boxShadow: '0 4px 24px rgba(132,162,130,0.12)' }}>
      {/* ── Left Panel: Conversation History ─────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-border bg-surface p-4 transition-transform duration-200 md:static md:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(132,162,130,0.20)', color: '#84A282' }}>
              <MessageSquare size={16} />
            </div>
            <h2 className="font-display text-sm font-bold tracking-tight" style={{ color: '#2D3A2C' }}>
              Discussions
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-text-muted hover:text-text-main p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Discussion Button */}
        <Button
          variant="primary"
          onClick={() => setIsNewChatModalOpen(true)}
          className="mb-3.5 flex w-full items-center justify-center gap-2 text-xs py-2.5 font-semibold shadow-glow-xs"
        >
          <Plus size={15} />
          <span>New Discussion</span>
        </Button>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {isLoadingList ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-10 text-center text-xs text-text-muted">
              No discussions yet. Click &quot;New Discussion&quot; above to start!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv._id === activeId
              const isRenaming = editingConvId === conv._id

              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    if (!isRenaming) {
                      setActiveId(conv._id)
                      setSidebarOpen(false)
                    }
                  }}
                  className={`group relative flex cursor-pointer items-start justify-between rounded-xl p-2.5 transition-all ${
                    isActive
                      ? 'border'
                      : 'border border-transparent'
                  }`}
                  style={isActive ? {
                    background: 'rgba(132,162,130,0.15)',
                    borderColor: 'rgba(132,162,130,0.40)',
                  } : {}}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(conv._id)
                            if (e.key === 'Escape') setEditingConvId(null)
                          }}
                          className="input text-xs py-1 px-2 w-full bg-surface"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => submitRename(conv._id)}
                          className="p-1 text-emerald-400 hover:bg-surface rounded"
                          title="Save title"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingConvId(null)}
                          className="p-1 text-text-muted hover:bg-surface rounded"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`truncate text-xs font-semibold ${
                            isActive ? 'text-primary-soft' : 'text-text-main'
                          }`}
                        >
                          {conv.title || 'New Chat'}
                        </p>
                        <p className="truncate text-[11px] text-text-muted mt-0.5">
                          {conv.lastMessagePreview || 'Empty'}
                        </p>
                      </>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          startRename(conv)
                        }}
                        className="text-text-muted hover:text-text-main p-1 rounded transition-colors"
                        title="Rename discussion"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Delete this conversation?')) {
                            deleteChatMutation.mutate(conv._id)
                          }
                        }}
                        className="text-text-muted hover:text-rose-400 p-1 rounded transition-colors"
                        title="Delete discussion"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Model info banner */}
        <div className="pt-3 mt-2 text-[11px] flex items-center justify-between" style={{ borderTop: '1px solid rgba(132,162,130,0.20)', color: '#7A8E79' }}>
          <span className="flex items-center gap-1.5 font-medium" style={{ color: '#4A5E49' }}>
            <Sparkles size={13} style={{ color: '#84A282' }} />
            Gemini 3.8 Flash
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(132,162,130,0.15)', color: '#5E7A5C' }}>
            Grounded
          </span>
        </div>
      </div>

      {/* ── Center/Right Panel: Chat Interface ──────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-bg/50">
        {/* Top Header */}
        <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden rounded-lg p-1.5 text-text-muted hover:text-text-main"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1" style={{ background: 'rgba(132,162,130,0.18)', color: '#84A282' }}>
                <Bot size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-sm font-bold tracking-tight text-text-main truncate max-w-[200px] sm:max-w-md">
                    {activeConversation?.title || 'Academic Advisor Chat'}
                  </h1>
                  {activeConversation && (
                    <button
                      type="button"
                      onClick={() => startRename(activeConversation)}
                      className="text-text-muted hover:text-text-main p-1 rounded transition-colors"
                      title="Rename discussion"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-text-muted truncate">
                  Personalized based on {profile?.course || 'your enrolled courses'}
                </p>
              </div>
            </div>
          </div>

          <Badge variant="primary" className="hidden sm:inline-flex text-[11px] gap-1 shrink-0">
            <Sparkles size={12} />
            <span>AI Online</span>
          </Badge>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {isLoadingActive ? (
            <div className="space-y-4 max-w-2xl mx-auto py-8">
              <Skeleton className="h-20 w-3/4 rounded-card" />
              <Skeleton className="h-32 w-full rounded-card ml-auto" />
            </div>
          ) : currentMessages.length === 0 && !optimisticUserMsg ? (
            /* Starter Prompts Empty State */
            <div className="mx-auto max-w-2xl py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary-soft shadow-glow-sm">
                  <Sparkles size={24} />
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight text-text-main">
                  Hi {profile?.displayName?.split(' ')[0] || 'there'}, how can I advise you today?
                </h2>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  I have context on your degree in {profile?.course || 'college'}, your weekly{' '}
                  {profile?.weeklyStudyHours || 20} study hours, and your enrolled courses.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {STARTER_PROMPTS.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(starter.prompt)}
                    className="flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-all group"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(132,162,130,0.22)', boxShadow: '0 2px 8px rgba(132,162,130,0.06)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(132,162,130,0.50)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(132,162,130,0.15)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(132,162,130,0.22)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(132,162,130,0.06)' }}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg group-hover:scale-110 transition-transform" style={{ background: 'rgba(132,162,130,0.15)', color: '#84A282' }}>
                      <starter.icon size={15} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#2D3A2C' }}>
                      {starter.title}
                    </span>
                    <span className="text-[11px] line-clamp-2" style={{ color: '#7A8E79' }}>
                      {starter.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="mx-auto max-w-3xl space-y-5">
              {currentMessages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1" style={{ background: 'rgba(132,162,130,0.18)', color: '#84A282' }}>
                        <Bot size={18} />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={isUser ? {
                        background: 'rgba(132,162,130,0.18)',
                        border: '1px solid rgba(132,162,130,0.30)',
                        color: '#2D3A2C',
                      } : {
                        background: '#FFFFFF',
                        border: '1px solid rgba(132,162,130,0.18)',
                        color: '#2D3A2C',
                        boxShadow: '0 2px 8px rgba(132,162,130,0.06)',
                      }}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose max-w-none text-xs leading-relaxed space-y-2" style={{ color: '#2D3A2C' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>

                          {/* Copy message button */}
                          <div className="flex justify-end pt-2 border-t border-border/40 mt-3">
                            <button
                              onClick={() => handleCopy(msg.content, idx)}
                              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-main transition-colors"
                            >
                              {isCopied === idx ? (
                                <>
                                  <Check size={12} className="text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised border border-border text-text-secondary mt-1 overflow-hidden shadow-xs">
                        {profile?.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="User" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon size={16} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Optimistic User Message (shown while sending) */}
              {optimisticUserMsg && (
                <div className="flex gap-3 justify-end">
                  <div className="relative max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/20 text-text-main border border-primary/30 p-4 text-xs leading-relaxed">
                    <p className="whitespace-pre-wrap">{optimisticUserMsg}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised border border-border text-text-secondary mt-1 overflow-hidden shadow-xs">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="User" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </div>
                </div>
              )}

              {/* Waiting for response bubble */}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 items-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-soft mt-1">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-surface p-4 text-xs text-text-muted flex items-center gap-2.5 shadow-sm">
                    <Loader2 size={15} className="animate-spin text-primary-soft" />
                    <span>Analyzing your syllabus and academic profile with Gemini...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────────── */}
        <div className="border-t border-border bg-surface p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="mx-auto max-w-3xl"
          >
            <div className="relative flex items-center rounded-xl border border-border bg-raised focus-within:border-primary transition-colors">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your academic advisor anything (e.g. explain a topic, plan study hours, exam prep)..."
                disabled={sendMessageMutation.isPending}
                className="w-full resize-none bg-transparent px-4 py-3 text-xs text-text-main placeholder-text-muted focus:outline-none max-h-32"
              />
              <div className="pr-2">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  className="h-8 w-8 !p-0 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                  title="Send message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-muted px-1">
              <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
              <span className="hidden sm:inline">Grounded with your courses & syllabus</span>
            </div>
          </form>
        </div>
      </div>

      {/* ── Modal: New Discussion (Custom Name or Auto-name) ────────────────── */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start New Discussion"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createChatMutation.mutate(newChatTitle)
          }}
          className="space-y-4"
        >
          <Input
            label="Discussion Title (Optional)"
            placeholder="e.g. Data Structures Exam Prep"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            autoFocus
          />
          <p className="text-[11px] text-text-muted leading-relaxed">
            Leave blank if you prefer the AI to <strong>automatically name</strong> this discussion based on your first question!
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewChatModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createChatMutation.isPending}
            >
              Start Discussion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
