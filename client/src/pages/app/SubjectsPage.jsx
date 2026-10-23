import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Plus,
  Search,
  Award,
  Layers,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  FileCheck,
} from 'lucide-react'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/api/subjects'
import { getRecords, createRecord, deleteRecord } from '@/api/records'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'

// Modular subcomponents
import SubjectCard from './subjects/SubjectCard'
import SubjectModal from './subjects/SubjectModal'
import RecordModal from './subjects/RecordModal'

export default function SubjectsPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const { user } = useAuth()

  // Navigation & filter state
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'completed' | 'in-progress'
  const [expandedSubjectId, setExpandedSubjectId] = useState(null)

  // Modals state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [recordDefaultSubjectId, setRecordDefaultSubjectId] = useState('')

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', user?.uid],
    queryFn: getSubjects,
    enabled: !!user,
  })

  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['records', user?.uid],
    queryFn: () => getRecords(),
    enabled: !!user,
  })

  // ── Mutations ───────────────────────────────────────────────────────────
  const subjectMutation = useMutation({
    mutationFn: (payload) =>
      editingSubject ? updateSubject(editingSubject._id, payload) : createSubject(payload),
    onSuccess: (savedSubject) => {
      if (savedSubject) {
        const updater = (old = []) =>
          editingSubject
            ? old.map((s) => (s._id === editingSubject._id ? savedSubject : s))
            : [savedSubject, ...old.filter((s) => s._id !== savedSubject._id)]
        queryClient.setQueryData(['subjects', user?.uid], updater)
        queryClient.setQueryData(['subjects'], updater)
      }
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsSubjectModalOpen(false)
      setEditingSubject(null)
      addToast(
        editingSubject ? 'Subject updated successfully!' : 'New subject added successfully!',
        'success',
      )
    },
    onError: (err) => {
      addToast(err?.response?.data?.error?.message || err?.message || 'Failed to save subject', 'error')
    },
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: (_, deletedId) => {
      const filterOut = (old = []) => old.filter((s) => s._id !== deletedId)
      queryClient.setQueryData(['subjects', user?.uid], filterOut)
      queryClient.setQueryData(['subjects'], filterOut)
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast('Subject and related assessments removed', 'success')
    },
    onError: (err) => {
      addToast(err?.response?.data?.error?.message || err.message || 'Failed to delete subject', 'error')
    },
  })

  const recordMutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsRecordModalOpen(false)
      addToast('Assessment record added successfully!', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to add assessment record', 'error')
    },
  })

  const deleteRecordMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      addToast('Assessment record removed', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to delete record', 'error')
    },
  })

  const updateTopicMutation = useMutation({
    mutationFn: ({ subjectId, syllabusTopics }) =>
      updateSubject(subjectId, { syllabusTopics }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      addToast(err.message || 'Failed to update syllabus topics', 'error')
    },
  })

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleOpenSubjectModal = (subj = null) => {
    setEditingSubject(subj)
    setIsSubjectModalOpen(true)
  }

  const handleOpenRecordModal = (subjectId = '') => {
    setRecordDefaultSubjectId(subjectId || subjects[0]?._id || '')
    setIsRecordModalOpen(true)
  }

  const handleToggleTopic = (subj, topicIndex) => {
    const updated = (subj.syllabusTopics || []).map((t, idx) =>
      idx === topicIndex ? { topic: t.topic, completed: !t.completed } : t,
    )
    updateTopicMutation.mutate({ subjectId: subj._id, syllabusTopics: updated })
  }

  const handleAddTopic = (subj, topicText) => {
    const updated = [...(subj.syllabusTopics || []), { topic: topicText, completed: false }]
    updateTopicMutation.mutate({ subjectId: subj._id, syllabusTopics: updated })
  }

  const handleDeleteTopic = (subj, topicIndex) => {
    const updated = (subj.syllabusTopics || []).filter((_, idx) => idx !== topicIndex)
    updateTopicMutation.mutate({ subjectId: subj._id, syllabusTopics: updated })
  }

  const handleDeleteSubject = (subj) => {
    if (window.confirm(`Delete "${subj.name}"? This will also remove all its linked assessments.`)) {
      deleteSubjectMutation.mutate(subj._id)
    }
  }

  const handleDeleteRecord = (rec) => {
    if (window.confirm(`Delete assessment record "${rec.title}"?`)) {
      deleteRecordMutation.mutate(rec._id)
    }
  }

  // ── Calculated Metrics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 3), 0)
    let totalTopics = 0
    let completedTopics = 0
    subjects.forEach((s) => {
      (s.syllabusTopics || []).forEach((t) => {
        totalTopics += 1
        if (t.completed) completedTopics += 1
      })
    })

    let totalMarksScored = 0
    let totalMarksPossible = 0
    records.forEach((r) => {
      totalMarksScored += r.score
      totalMarksPossible += r.totalMarks
    })
    const overallAvg =
      totalMarksPossible > 0 ? Math.round((totalMarksScored / totalMarksPossible) * 100) : null

    return {
      totalSubjects: subjects.length,
      totalCredits,
      totalTopics,
      completedTopics,
      syllabusPct: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      overallAvg,
    }
  }, [subjects, records])

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (filterMode === 'all') return true
      const total = s.syllabusTopics?.length || 0
      const comp = s.syllabusTopics?.filter((t) => t.completed).length || 0
      if (filterMode === 'completed') return total > 0 && comp === total
      if (filterMode === 'in-progress') return total === 0 || comp < total
      return true
    })
  }, [subjects, search, filterMode])

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-text-main md:text-3xl">
              Course Portfolio & Syllabus
            </h1>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary-soft border border-primary/30">
              Active Term
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            Manage your courses, track syllabus mastery, and monitor assessment records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => handleOpenRecordModal()}
            disabled={subjects.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs min-h-[38px]"
          >
            <Plus size={15} />
            <span>Add Assessment</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => handleOpenSubjectModal()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs min-h-[38px]"
          >
            <Plus size={15} />
            <span>Add Course</span>
          </Button>
        </div>
      </div>

      {/* ── Overview Stat Strip ─────────────────────────────────────────── */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
          <div className="card p-3 sm:p-3.5 bg-surface/70 border-border flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-soft">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted font-medium truncate">Enrolled Courses</p>
              <h4 className="font-display text-base sm:text-lg font-bold text-text-main truncate">
                {stats.totalSubjects}{' '}
                <span className="text-xs font-normal text-text-muted">({stats.totalCredits} cr)</span>
              </h4>
            </div>
          </div>

          <div className="card p-3 sm:p-3.5 bg-surface/70 border-border flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted font-medium truncate">Syllabus Covered</p>
              <h4 className="font-display text-base sm:text-lg font-bold text-text-main truncate">
                {stats.syllabusPct}%{' '}
                <span className="text-xs font-normal text-text-muted">
                  ({stats.completedTopics}/{stats.totalTopics})
                </span>
              </h4>
            </div>
          </div>

          <div className="card p-3 sm:p-3.5 bg-surface/70 border-border flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Award size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted font-medium truncate">Avg. Marks</p>
              <h4 className="font-display text-base sm:text-lg font-bold text-text-main truncate">
                {stats.overallAvg !== null ? `${stats.overallAvg}%` : '—'}
              </h4>
            </div>
          </div>

          <div className="card p-3 sm:p-3.5 bg-surface/70 border-border flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <FileCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted font-medium truncate">Assessments</p>
              <h4 className="font-display text-base sm:text-lg font-bold text-text-main truncate">{records.length} logged</h4>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      {subjects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            <input
              type="text"
              placeholder="Search course name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input text-xs w-full pl-9 pr-4 py-2 bg-raised border-border text-text-main placeholder-text-muted"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <SlidersHorizontal size={12} /> Filter:
            </span>
            <div className="flex rounded-lg bg-raised p-0.5 border border-border text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-surface text-text-main font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('in-progress')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterMode === 'in-progress'
                    ? 'bg-surface text-text-main font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterMode === 'completed'
                    ? 'bg-surface text-text-main font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Mastered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subject Cards List ──────────────────────────────────────────── */}
      {isLoadingSubjects ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="card text-center py-14 border-dashed">
          <EmptyState
            icon={BookOpen}
            title="No courses registered yet"
            description="Add the subjects you are taking this semester to break down syllabi into manageable units and track test scores."
            action={
              <Button
                variant="primary"
                onClick={() => handleOpenSubjectModal()}
                className="mt-4 flex items-center gap-2 mx-auto text-xs"
              >
                <Plus size={15} />
                <span>Add Your First Course</span>
              </Button>
            }
          />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="card text-center py-10 text-xs text-text-muted">
          No courses found matching &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              records={records}
              isExpanded={expandedSubjectId === subject._id}
              onToggleExpand={() =>
                setExpandedSubjectId((prev) => (prev === subject._id ? null : subject._id))
              }
              onEdit={handleOpenSubjectModal}
              onDelete={handleDeleteSubject}
              onOpenRecordModal={handleOpenRecordModal}
              onToggleTopic={handleToggleTopic}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
              onDeleteRecord={handleDeleteRecord}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={(payload) => subjectMutation.mutate(payload)}
        editingSubject={editingSubject}
        isLoading={subjectMutation.isPending}
        existingSubjects={subjects}
      />

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={(payload) => recordMutation.mutate(payload)}
        subjects={subjects}
        defaultSubjectId={recordDefaultSubjectId}
        isLoading={recordMutation.isPending}
      />
    </div>
  )
}
