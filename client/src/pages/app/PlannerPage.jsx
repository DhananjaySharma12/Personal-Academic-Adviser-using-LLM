import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Brain,
  Target,
  RefreshCw,
  Zap,
  AlertCircle,
} from 'lucide-react'
import {
  getStudyPlans,
  getStudyPlanById,
  generateStudyPlan,
  deleteStudyPlan,
  updateTask,
} from '@/api/studyPlanner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ProgressRing from '@/components/ui/ProgressRing'
import Skeleton from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_COLORS = {
  Monday: '#84A282',
  Tuesday: '#B8CFB3',
  Wednesday: '#5E7A5C',
  Thursday: '#84A282',
  Friday: '#B8CFB3',
  Saturday: '#C08A9A',
  Sunday: '#9B6E7E',
}

const TECHNIQUE_ICONS = {
  'Active Recall': Brain,
  'Feynman Method': Sparkles,
  'Practice Problems': Target,
  'Mind Mapping': Zap,
  'Spaced Repetition Review': RefreshCw,
  Flashcards: BookOpen,
  'Active Study': Brain,
}

function TechniqueIcon({ technique, size = 13 }) {
  const Icon = TECHNIQUE_ICONS[technique] || Brain
  return <Icon size={size} />
}

function TaskCard({ task, onToggle, isUpdating }) {
  const [showNotes, setShowNotes] = useState(false)

  const durationLabel =
    task.duration >= 60
      ? `${Math.floor(task.duration / 60)}h ${task.duration % 60 > 0 ? task.duration % 60 + 'm' : ''}`
      : `${task.duration}m`

  return (
    <div
      className={`group relative rounded-xl border p-3.5 transition-all duration-200 ${
        task.completed
          ? 'border-success/30 bg-success/5 opacity-75'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task._id, !task.completed)}
          disabled={isUpdating}
          className="mt-0.5 shrink-0 text-text-muted hover:text-primary-soft transition-colors"
        >
          {isUpdating ? (
            <Loader2 size={18} className="animate-spin text-primary-soft" />
          ) : task.completed ? (
            <CheckCircle2 size={18} className="text-success" />
          ) : (
            <Circle size={18} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold leading-snug ${
              task.completed ? 'text-text-muted line-through' : 'text-text-main'
            }`}
          >
            {task.topic}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">{task.subjectName}</p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-text-muted bg-raised px-2 py-0.5 rounded-full border border-border">
              <Clock size={10} />
              {durationLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-primary-soft bg-primary/10 px-2 py-0.5 rounded-full">
              <TechniqueIcon technique={task.technique} size={10} />
              {task.technique}
            </span>
            {task.notes && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-[10px] text-text-muted hover:text-text-main"
              >
                {showNotes ? 'Hide notes' : 'Show notes'}
              </button>
            )}
          </div>

          {showNotes && task.notes && (
            <p className="mt-2 text-[11px] text-text-secondary bg-raised/60 rounded-lg p-2 border border-border">
              {task.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DayColumn({ day, tasks, onToggle, updatingTask }) {
  const [collapsed, setCollapsed] = useState(false)
  const totalMin = tasks.reduce((sum, t) => sum + t.duration, 0)
  const doneCount = tasks.filter((t) => t.completed).length
  const dayColor = DAY_COLORS[day]

  if (tasks.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-raised/60 transition-colors"
        style={{ borderLeft: `3px solid ${dayColor}` }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-bold text-text-main text-left">{day}</p>
            <p className="text-[11px] text-text-muted text-left">
              {tasks.length} session{tasks.length !== 1 ? 's' : ''} ·{' '}
              {totalMin >= 60
                ? `${Math.floor(totalMin / 60)}h ${totalMin % 60 > 0 ? totalMin % 60 + 'm' : ''}`
                : `${totalMin}m`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium" style={{ color: dayColor }}>
            {doneCount}/{tasks.length}
          </span>
          {collapsed ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronUp size={14} className="text-text-muted" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2.5 pt-1">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggle={onToggle}
              isUpdating={updatingTask === task._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GenerateModal({ open, onClose, onGenerate, isLoading }) {
  const [weekLabel, setWeekLabel] = useState('')
  const [focus, setFocus] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onGenerate({
      weekLabel: weekLabel || undefined,
      focus: focus || undefined,
      weeklyHours: weeklyHours ? Number(weeklyHours) : undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate AI Study Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5">
            Week Label <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            type="text"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="e.g. Week 3 – Mid-term Prep"
            className="input-base w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5">
            Weekly Study Hours <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            type="number"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            min={1}
            max={80}
            placeholder="e.g. 25"
            className="input-base w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5">
            Focus / Priority <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Prioritize Data Structures and finish Calculus Chapter 4 before Thursday"
            rows={3}
            className="input-base w-full text-xs resize-none"
          />
          <p className="text-[10px] text-text-muted mt-1">
            Tell the AI what to focus on. Leave blank for balanced coverage.
          </p>
        </div>

        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <Sparkles size={14} className="text-primary-soft mt-0.5 shrink-0" />
          <p className="text-[11px] text-text-secondary leading-relaxed">
            The AI will analyze your enrolled subjects, syllabus progress, and assessment scores to
            generate a personalized, optimized weekly study schedule.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isLoading} className="gap-2">
            <Sparkles size={13} />
            Generate Plan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function PlannerPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const [activePlanId, setActivePlanId] = useState(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [updatingTask, setUpdatingTask] = useState(null)

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['study-plans'],
    queryFn: getStudyPlans,
  })

  // Set first plan as active on load
  const effectiveActivePlanId = activePlanId ?? plans[0]?._id ?? null

  const { data: activePlan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['study-plan', effectiveActivePlanId],
    queryFn: () => getStudyPlanById(effectiveActivePlanId),
    enabled: !!effectiveActivePlanId,
  })

  const generateMutation = useMutation({
    mutationFn: generateStudyPlan,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] })
      queryClient.setQueryData(['study-plan', plan._id], plan)
      setActivePlanId(plan._id)
      setGenerateOpen(false)
      addToast('Study plan generated! 🎯', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to generate plan', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudyPlan,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] })
      if (effectiveActivePlanId === deletedId) {
        const remaining = plans.filter((p) => p._id !== deletedId)
        setActivePlanId(remaining[0]?._id || null)
      }
      addToast('Plan deleted', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to delete plan', 'error')
    },
  })

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, completed }) => updateTask(taskId, { completed }),
    onMutate: ({ taskId }) => setUpdatingTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', effectiveActivePlanId] })
      queryClient.invalidateQueries({ queryKey: ['study-plans'] })
      setUpdatingTask(null)
    },
    onError: (err) => {
      setUpdatingTask(null)
      addToast(err.message || 'Failed to update task', 'error')
    },
  })

  const handleToggle = (taskId, completed) => {
    toggleTaskMutation.mutate({ taskId, completed })
  }

  const tasksByDay = DAYS.reduce((acc, day) => {
    acc[day] = (activePlan?.tasks || []).filter((t) => t.day === day)
    return acc
  }, {})

  const totalMinutes = (activePlan?.tasks || []).reduce((sum, t) => sum + t.duration, 0)
  const completedCount = (activePlan?.tasks || []).filter((t) => t.completed).length
  const totalCount = (activePlan?.tasks || []).length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const displayPlanId = activePlanId ?? plans[0]?._id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-main flex items-center gap-2">
            <Calendar size={22} className="text-primary-soft" />
            Study Planner
          </h1>
          <p className="text-xs text-text-muted mt-1">
            AI-generated personalized weekly study schedules
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-2 text-xs self-start sm:self-auto"
        >
          <Sparkles size={14} />
          Generate New Plan
        </Button>
      </div>

      {/* Content */}
      {isLoadingPlans ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-soft">
            <Calendar size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold text-text-main">No Study Plans Yet</h2>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Let AI analyze your subjects, scores, and goals to create a personalized weekly study
              schedule — tailored to your learning style.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setGenerateOpen(true)}
            className="inline-flex items-center gap-2 text-xs"
          >
            <Sparkles size={14} />
            Generate Your First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Plan list sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">
              My Plans ({plans.length})
            </h2>
            {plans.map((plan) => {
              const isCurrent = plan._id === displayPlanId
              return (
                <div
                  key={plan._id}
                  onClick={() => setActivePlanId(plan._id)}
                  className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-primary/20 hover:bg-raised/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isCurrent ? 'text-primary-soft' : 'text-text-main'}`}>
                        {plan.weekLabel}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {plan.taskCount} tasks · {plan.weeklyHours}h/wk
                      </p>
                    </div>
                    {plan.isActive && (
                      <Badge variant="primary" className="text-[10px] shrink-0">Active</Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                      <span>{plan.completedCount}/{plan.taskCount} done</span>
                      <span>{plan.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-soft transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Delete this study plan?')) deleteMutation.mutate(plan._id)
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-1 rounded transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Active plan detail */}
          <div className="lg:col-span-3 space-y-4">
            {isLoadingPlan ? (
              <div className="space-y-3">
                {DAYS.slice(0, 5).map((d) => (
                  <Skeleton key={d} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : activePlan ? (
              <>
                {/* Stats summary */}
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <ProgressRing value={progress} size={72} stroke={6} label={`${progress}%`} />
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-text-main">{totalCount}</p>
                        <p className="text-[10px] text-text-muted">Total Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-success">{completedCount}</p>
                        <p className="text-[10px] text-text-muted">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary-soft">
                          {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h` : `${totalMinutes}m`}
                        </p>
                        <p className="text-[10px] text-text-muted">Total Study</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-text-main">{totalCount - completedCount}</p>
                        <p className="text-[10px] text-text-muted">Remaining</p>
                      </div>
                    </div>
                    {activePlan.focus && (
                      <div className="sm:max-w-[200px]">
                        <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Focus</p>
                        <p className="text-[11px] text-text-secondary leading-snug">{activePlan.focus}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day columns */}
                <div className="space-y-3">
                  {DAYS.map((day) =>
                    tasksByDay[day]?.length > 0 ? (
                      <DayColumn
                        key={day}
                        day={day}
                        tasks={tasksByDay[day]}
                        onToggle={handleToggle}
                        updatingTask={updatingTask}
                      />
                    ) : null,
                  )}
                </div>

                {Object.values(tasksByDay).every((arr) => arr.length === 0) && (
                  <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <AlertCircle size={16} className="text-warning shrink-0" />
                    <p className="text-xs text-text-secondary">
                      This plan has no tasks. Generate a new plan to get started.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-text-muted text-xs">
                Select a plan to view its schedule
              </div>
            )}
          </div>
        </div>
      )}

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={(data) => generateMutation.mutate(data)}
        isLoading={generateMutation.isPending}
      />
    </div>
  )
}
