import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  HelpCircle,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Trash2,
  BookOpen,
  Brain,
  History,
  MessageSquare,
  Flame,
  Check,
  Code2,
  CheckSquare2,
  Lightbulb,
  ListFilter,
  Loader2,
} from 'lucide-react'
import {
  getQuizzes,
  getQuizById,
  generateQuiz,
  submitQuiz,
  getQuizAttempts,
  deleteQuiz,
} from '@/api/quiz'
import { getSubjects } from '@/api/subjects'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

const QUIZ_TYPES = [
  {
    id: 'mcq',
    label: 'Multiple Choice (MCQ)',
    desc: '4 options, 1 correct choice — standard active recall',
    icon: CheckSquare2,
    badgeColor: 'text-primary-soft bg-primary/10 border-primary/30',
  },
  {
    id: 'true_false',
    label: 'True / False',
    desc: 'Assertion tests & common student misconception busters',
    icon: HelpCircle,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'code_problem',
    label: 'Code & Problem Solving',
    desc: 'Predict outputs, trace algorithms, and spot code bugs',
    icon: Code2,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'short_answer',
    label: 'Conceptual Reasoning',
    desc: 'In-depth "why & how" reasoning behind core mechanisms',
    icon: Lightbulb,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
]

export default function QuizPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  // Views: 'hub' | 'taking' | 'results'
  const [view, setView] = useState('hub')
  const [hubTab, setHubTab] = useState('quizzes') // 'quizzes' | 'history'

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({}) // { [qIndex]: optionIndex }
  const [quizResults, setQuizResults] = useState(null)
  const [loadingQuizId, setLoadingQuizId] = useState(null)

  // Generate Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [genQuizType, setGenQuizType] = useState('mcq')
  const [genSubjectId, setGenSubjectId] = useState('')
  const [genTopic, setGenTopic] = useState('')
  const [genDifficulty, setGenDifficulty] = useState('medium')
  const [genNumQuestions, setGenNumQuestions] = useState(5)

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: getQuizzes,
  })

  const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: getQuizAttempts,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  })

  // ── Mutations ───────────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: generateQuiz,
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      setIsModalOpen(false)
      addToast('Quiz generated successfully! Starting now...', 'success')
      startQuiz(newQuiz)
    },
    onError: (err) => {
      const isQuota = err.status === 429 || (err.message || '').toLowerCase().includes('quota')
      if (isQuota) {
        addToast(
          '⚠️ AI quota exceeded for today (free tier: 20 req/day). Try again tomorrow or get a paid API key at aistudio.google.com',
          'error'
        )
      } else {
        addToast(err.message || 'Failed to generate quiz', 'error')
      }
    },
  })

  const submitMutation = useMutation({
    mutationFn: ({ id, answers }) => submitQuiz(id, answers),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] })
      setQuizResults(results)
      setView('results')
      addToast('Quiz submitted! Check your score and explanations.', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to submit quiz', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] })
      addToast('Quiz removed', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to delete quiz', 'error')
    },
  })

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleOpenGenerate = () => {
    if (subjects.length > 0 && !genSubjectId) {
      setGenSubjectId(subjects[0]._id)
    }
    setGenTopic('')
    setIsModalOpen(true)
  }

  const handleGenerateSubmit = (e) => {
    e.preventDefault()
    if (!genSubjectId || !genTopic.trim()) return

    generateMutation.mutate({
      subjectId: genSubjectId,
      topic: genTopic.trim(),
      difficulty: genDifficulty,
      quizType: genQuizType,
      numQuestions: genNumQuestions,
    })
  }

  const startQuiz = async (quiz) => {
    let quizToRun = quiz

    // If quiz questions are missing, fetch the full quiz with questions!
    if (!quizToRun.questions || quizToRun.questions.length === 0) {
      try {
        setLoadingQuizId(quiz._id)
        quizToRun = await getQuizById(quiz._id)
      } catch {
        addToast('Failed to load quiz questions. Please try again.', 'error')
        setLoadingQuizId(null)
        return
      } finally {
        setLoadingQuizId(null)
      }
    }

    if (!quizToRun.questions || quizToRun.questions.length === 0) {
      addToast('This quiz has no questions available.', 'warning')
      return
    }

    setActiveQuiz(quizToRun)
    setCurrentQIndex(0)
    setSelectedAnswers({})
    setQuizResults(null)
    setView('taking')
  }

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
  }

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return
    const formatted = Object.entries(selectedAnswers).map(([k, v]) => ({
      questionIndex: Number(k),
      selectedOptionIndex: Number(v),
    }))

    const answeredCount = Object.keys(selectedAnswers).length
    const totalCount = activeQuiz.questions?.length || 0

    if (answeredCount < totalCount) {
      const confirm = window.confirm(
        `You have answered ${answeredCount} of ${totalCount} questions. Submit anyway?`
      )
      if (!confirm) return
    }

    submitMutation.mutate({
      id: activeQuiz._id,
      answers: formatted,
    })
  }

  const selectedSubject = subjects.find((s) => s._id === genSubjectId)
  const syllabusTopics = selectedSubject?.syllabusTopics || []

  // Metrics
  const totalCompletedAttempts = attempts.length
  const avgPercentage =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
      : null

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: TAKING QUIZ
  // ──────────────────────────────────────────────────────────────────────────
  if (view === 'taking' && activeQuiz) {
    const questions = activeQuiz.questions || []
    const totalQ = questions.length

    if (totalQ === 0) {
      return (
        <div className="mx-auto max-w-xl py-12 text-center space-y-4">
          <XCircle size={36} className="mx-auto text-rose-400" />
          <h3 className="font-display text-lg font-bold text-text-main">No questions found</h3>
          <p className="text-xs text-text-muted">This quiz did not return any questions.</p>
          <Button variant="secondary" size="sm" onClick={() => setView('hub')}>
            Back to Quizzes
          </Button>
        </div>
      )
    }

    const currentQuestion = questions[currentQIndex]
    const progress = totalQ > 0 ? Math.round(((currentQIndex + 1) / totalQ) * 100) : 0
    const currentTypeConfig =
      QUIZ_TYPES.find((t) => t.id === activeQuiz.quizType) || QUIZ_TYPES[0]

    return (
      <div className="mx-auto max-w-3xl space-y-6 py-2">
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${currentTypeConfig.badgeColor}`}
              >
                {currentTypeConfig.label}
              </span>
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary-soft uppercase border border-primary/30">
                {activeQuiz.difficulty?.toUpperCase()}
              </span>
              <h2 className="font-display text-base font-bold text-text-main truncate max-w-xs sm:max-w-md">
                {activeQuiz.title}
              </h2>
            </div>
            <p className="text-xs text-text-muted">
              Question {currentQIndex + 1} of {totalQ} • {Math.round(progress)}% completed
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Quit this quiz session? Progress will not be saved.')) {
                setView('hub')
              }
            }}
            className="text-xs text-text-muted hover:text-text-main"
          >
            Quit Quiz
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="card p-6 space-y-6 shadow-glow-xs bg-surface/90">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary-soft uppercase tracking-wider">
                  Question {currentQIndex + 1}
                </span>
                <span className="text-[11px] text-text-muted">
                  Topic: {activeQuiz.topic}
                </span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-text-main leading-snug whitespace-pre-wrap">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQuestion.options?.map((optText, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQIndex, optIdx)}
                    className={`w-full flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-glow-xs ring-1 ring-primary'
                        : 'border-border bg-raised/70 hover:border-primary/40 hover:bg-raised'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-border text-text-secondary'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-text-main flex-1">
                      {optText}
                    </span>
                    {isSelected && (
                      <Check size={18} className="text-primary-soft shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
            disabled={currentQIndex === 0}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </Button>

          {currentQIndex < totalQ - 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentQIndex((i) => i + 1)}
              className="flex items-center gap-1.5"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitQuiz}
              loading={submitMutation.isPending}
              className="flex items-center gap-1.5 shadow-glow-xs"
            >
              <span>Submit & Grade</span>
              <CheckCircle2 size={16} />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: RESULTS & REVIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (view === 'results' && quizResults) {
    const { score, totalQuestions, percentage, results = [] } = quizResults
    const isPassing = percentage >= 60

    return (
      <div className="mx-auto max-w-3xl space-y-6 py-2">
        {/* Score Card Banner */}
        <div className="card relative overflow-hidden p-6 sm:p-8 text-center bg-gradient-to-b from-surface to-raised border-border">
          <div
            className={`pointer-events-none absolute inset-0 blur-3xl opacity-20 ${
              isPassing ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />

          <div className="relative space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-border shadow-inner">
              <Award size={32} className={isPassing ? 'text-emerald-400' : 'text-amber-400'} />
            </div>

            <h2 className="font-display text-2xl font-bold text-text-main">
              {isPassing ? 'Mastery Demonstrated! 🎉' : 'Needs Review & Practice 📚'}
            </h2>

            <div className="flex items-center justify-center gap-2">
              <span className="font-display text-4xl font-extrabold text-text-main font-mono">
                {score} / {totalQuestions}
              </span>
              <span
                className={`text-lg font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  isPassing
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {percentage}%
              </span>
            </div>

            <p className="text-xs text-text-secondary max-w-md mx-auto">
              {isPassing
                ? 'Great job! You have demonstrated good comprehension of this academic unit.'
                : 'Review the explanations below and discuss weak concepts with your AI advisor.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => startQuiz(activeQuiz)}
                className="flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Retake Quiz</span>
              </Button>
              <Link to="/app/chat">
                <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  <span>Ask AI Advisor About Weak Areas</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('hub')}
              >
                Back to All Quizzes
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Review Breakdown */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-text-main">
            Question-by-Question Review & Explanations
          </h3>

          {results.map((r, idx) => (
            <div
              key={idx}
              className={`card p-5 border transition-all ${
                r.isCorrect ? 'border-emerald-500/30 bg-surface/80' : 'border-rose-500/30 bg-surface/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-muted">Q{idx + 1}.</span>
                  <h4 className="font-display text-sm font-bold text-text-main">
                    {r.questionText}
                  </h4>
                </div>
                {r.isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 shrink-0">
                    <CheckCircle2 size={16} /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 shrink-0">
                    <XCircle size={16} /> Incorrect
                  </span>
                )}
              </div>

              {/* Options Breakdown */}
              <div className="space-y-1.5 my-3">
                {r.options?.map((opt, oIdx) => {
                  const wasSelected = r.selectedOptionIndex === oIdx
                  const isCorrectAnswer = r.correctOptionIndex === oIdx

                  let badgeStyle = 'bg-raised/40 border-border/40 text-text-secondary'
                  if (isCorrectAnswer) {
                    badgeStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                  } else if (wasSelected && !isCorrectAnswer) {
                    badgeStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold'
                  }

                  return (
                    <div
                      key={oIdx}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${badgeStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      <div className="text-[10px] font-medium">
                        {isCorrectAnswer && '✓ Correct Answer'}
                        {wasSelected && !isCorrectAnswer && '✗ Your Choice'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Explanation Note */}
              {r.explanation && (
                <div className="rounded-xl bg-raised/80 border border-border p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-primary-soft font-semibold text-[11px]">
                    <Brain size={13} />
                    <span>Concept Explanation</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">{r.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: MAIN HUB (Quizzes & History)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-main md:text-3xl">
              AI Quiz Generator
            </h1>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary-soft border border-primary/30">
              Active Recall
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            Choose quiz types, generate topic-targeted questions with Gemini, test your skills, and master core concepts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenGenerate}
          disabled={subjects.length === 0}
          className="flex items-center gap-2 text-xs self-start md:self-auto shadow-glow-xs"
        >
          <Sparkles size={15} />
          <span>Generate New Quiz</span>
        </Button>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="card p-4 flex items-center gap-3"
          style={{ background: '#FFFFFF', borderColor: 'rgba(132, 162, 130, 0.25)', boxShadow: '0 2px 14px rgba(132, 162, 130, 0.08)' }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(132, 162, 130, 0.15)', color: '#84A282' }}
          >
            <HelpCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted font-medium truncate">Generated Quizzes</p>
            <h4 className="font-display text-lg font-bold text-text-main">{quizzes.length}</h4>
          </div>
        </div>

        <div
          className="card p-4 flex items-center gap-3"
          style={{ background: '#FFFFFF', borderColor: 'rgba(132, 162, 130, 0.25)', boxShadow: '0 2px 14px rgba(132, 162, 130, 0.08)' }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(184, 207, 179, 0.25)', color: '#5E7A5C' }}
          >
            <History size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted font-medium truncate">Attempts Logged</p>
            <h4 className="font-display text-lg font-bold text-text-main">{totalCompletedAttempts}</h4>
          </div>
        </div>

        <div
          className="card p-4 flex items-center gap-3"
          style={{ background: '#FFFFFF', borderColor: 'rgba(132, 162, 130, 0.25)', boxShadow: '0 2px 14px rgba(132, 162, 130, 0.08)' }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(132, 162, 130, 0.20)', color: '#84A282' }}
          >
            <Award size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted font-medium truncate">Average Score</p>
            <h4 className="font-display text-lg font-bold text-text-main">
              {avgPercentage !== null ? `${avgPercentage}%` : '—'}
            </h4>
          </div>
        </div>

        <div
          className="card p-4 flex items-center gap-3"
          style={{ background: '#FFFFFF', borderColor: 'rgba(132, 162, 130, 0.25)', boxShadow: '0 2px 14px rgba(132, 162, 130, 0.08)' }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(246, 226, 233, 0.65)', color: '#8B4A5E' }}
          >
            <Flame size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted font-medium truncate">Mastery Level</p>
            <h4 className="font-display text-lg font-bold text-text-main">
              {avgPercentage && avgPercentage >= 75 ? 'Superior' : avgPercentage ? 'Intermediate' : 'Ready'}
            </h4>
          </div>
        </div>
      </div>

      {/* ── Tabs: Quizzes vs History ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setHubTab('quizzes')}
          className={`flex items-center gap-1.5 pb-2 transition-colors ${
            hubTab === 'quizzes'
              ? 'text-primary-soft border-b-2 border-primary font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <BookOpen size={14} />
          <span>Active Quizzes ({quizzes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setHubTab('history')}
          className={`flex items-center gap-1.5 pb-2 transition-colors ${
            hubTab === 'history'
              ? 'text-primary-soft border-b-2 border-primary font-semibold'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <History size={14} />
          <span>Past Attempts ({attempts.length})</span>
        </button>
      </div>

      {/* ── Quizzes Tab Content ─────────────────────────────────────────── */}
      {hubTab === 'quizzes' && (
        <>
          {isLoadingQuizzes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Skeleton className="h-32 w-full rounded-card" />
              <Skeleton className="h-32 w-full rounded-card" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="card text-center py-14 border-dashed">
              <EmptyState
                icon={HelpCircle}
                title="No quizzes generated yet"
                description="Pick your desired format (MCQ, True/False, or Code Problems), select a topic, and let Gemini generate an interactive quiz."
                action={
                  <Button
                    variant="primary"
                    onClick={handleOpenGenerate}
                    disabled={subjects.length === 0}
                    className="mt-4 flex items-center gap-2 mx-auto text-xs"
                  >
                    <Sparkles size={15} />
                    <span>Create Your First Quiz</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {quizzes.map((quiz) => {
                const color = quiz.subject?.color || '#84A282'
                const typeInfo =
                  QUIZ_TYPES.find((t) => t.id === quiz.quizType) || QUIZ_TYPES[0]
                const isStarting = loadingQuizId === quiz._id

                return (
                  <div
                    key={quiz._id}
                    className="card p-5 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-border/90 flex flex-col justify-between gap-4"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: color }}
                        >
                          {quiz.subject?.name || 'General'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.badgeColor}`}
                          >
                            {typeInfo.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              quiz.difficulty === 'hard'
                                ? 'text-rose-400 bg-rose-500/10'
                                : quiz.difficulty === 'easy'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-amber-400 bg-amber-500/10'
                            }`}
                          >
                            {quiz.difficulty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete quiz "${quiz.title}"?`)) {
                                deleteMutation.mutate(quiz._id)
                              }
                            }}
                            className="text-text-muted hover:text-rose-400 p-1 rounded transition-colors"
                            title="Delete quiz"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-display text-base font-bold text-text-main line-clamp-1">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-text-secondary line-clamp-2">
                        Topic: <strong className="text-text-main">{quiz.topic}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      <span className="text-text-muted">
                        {quiz.questionCount || quiz.questions?.length || 5} Questions
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isStarting}
                        onClick={() => startQuiz(quiz)}
                        className="flex items-center gap-1.5 text-xs py-1.5"
                      >
                        {isStarting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Play size={13} />
                        )}
                        <span>{isStarting ? 'Loading...' : 'Start Quiz'}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── History Tab Content ─────────────────────────────────────────── */}
      {hubTab === 'history' && (
        <>
          {isLoadingAttempts ? (
            <div className="space-y-2.5">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="card text-center py-10 text-xs text-text-muted">
              No quiz attempts logged yet. Complete a quiz to see your mastery record here!
            </div>
          ) : (
            <div className="space-y-2.5">
              {attempts.map((att) => {
                const isPassing = att.percentage >= 60
                return (
                  <div
                    key={att._id}
                    className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/70 border-border hover:border-border/90 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: att.subjectId?.color || '#84A282' }}
                        />
                        <h4 className="font-display text-sm font-bold text-text-main truncate">
                          {att.quizId?.title || 'Academic Assessment Quiz'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        Taken on {new Date(att.createdAt).toLocaleDateString()} at{' '}
                        {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-text-main">
                          {att.score} / {att.totalQuestions}
                        </p>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isPassing ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {att.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal: Generate AI Quiz ─────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate AI Quiz with Gemini"
        size="lg"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          {/* Step 1: Format Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-main">
              1. Choose Quiz Format / Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUIZ_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = genQuizType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setGenQuizType(type.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-glow-xs ring-1 ring-primary'
                        : 'border-border bg-raised/70 hover:border-border hover:bg-raised'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-main">{type.label}</p>
                      <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{type.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Subject & Topic */}
          <div className="border-t border-border/60 pt-3 space-y-3">
            <label className="block text-xs font-semibold text-text-main">
              2. Target Subject & Topic
            </label>

            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Course / Subject
              </label>
              <select
                value={genSubjectId}
                onChange={(e) => setGenSubjectId(e.target.value)}
                className="input text-xs w-full bg-raised border-border text-text-main cursor-pointer"
                required
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Specific Topic or Chapter
              </label>
              <Input
                placeholder="e.g. Arrays, Memory Management, Process Scheduling, Dynamic Programming"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                required
              />

              {/* Quick syllabus topic suggestion chips */}
              {syllabusTopics.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] text-text-muted">Or pick from syllabus units:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-0.5">
                    {syllabusTopics.map((top, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGenTopic(top.topic)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                          genTopic === top.topic
                            ? 'bg-primary/20 border-primary text-primary-soft font-medium'
                            : 'bg-raised border-border text-text-secondary hover:text-text-main'
                        }`}
                      >
                        {top.topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Difficulty & Count */}
          <div className="border-t border-border/60 pt-3">
            <label className="block text-xs font-semibold text-text-main mb-2">
              3. Difficulty & Question Count
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Difficulty Level
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="input text-xs w-full bg-raised border-border text-text-main cursor-pointer"
                >
                  <option value="easy">Easy (Foundational & Definitions)</option>
                  <option value="medium">Medium (Application & Logic)</option>
                  <option value="hard">Hard (Complex Problems & Edge Cases)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  Number of Questions
                </label>
                <select
                  value={genNumQuestions}
                  onChange={(e) => setGenNumQuestions(Number(e.target.value))}
                  className="input text-xs w-full bg-raised border-border text-text-main cursor-pointer"
                >
                  <option value={3}>3 Questions (Quick check)</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={10}>10 Questions (Deep test)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={generateMutation.isPending}
              className="flex items-center gap-1.5 shadow-glow-xs"
            >
              <Sparkles size={14} />
              <span>Generate Quiz</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
