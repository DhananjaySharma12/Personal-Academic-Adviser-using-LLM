/**
 * RemindersPage.jsx — Phase 10: Academic Deadlines & Task Reminders
 * Sage & Blush botanical aesthetic with glowing badges and task trackers.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  BookOpen,
  Filter,
  X,
  Sparkles,
} from 'lucide-react'
import { getReminders, createReminder, toggleReminder, deleteReminder } from '@/api/reminders'
import { useToast } from '@/components/ui/Toast'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
}

export default function RemindersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'pending' | 'completed' | 'high'
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'study_task',
    priority: 'medium',
    subjectId: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: getReminders,
  })

  const reminders = data?.reminders || []
  const subjects = data?.subjects || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      toast('Reminder created successfully', 'success')
      setShowAddModal(false)
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        type: 'study_task',
        priority: 'medium',
        subjectId: '',
      })
    },
    onError: (err) => {
      toast(err?.response?.data?.error?.message || 'Failed to create reminder', 'error')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleReminder,
    onSuccess: (updated) => {
      queryClient.setQueryData(['reminders'], (old) => {
        if (!old) return old
        return {
          ...old,
          reminders: old.reminders.map((r) => (r._id === updated._id ? updated : r)),
        }
      })
      toast(updated.isCompleted ? 'Marked as completed' : 'Marked as pending', 'info')
    },
    onError: () => toast('Failed to update status', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: ({ id }) => {
      queryClient.setQueryData(['reminders'], (old) => {
        if (!old) return old
        return {
          ...old,
          reminders: old.reminders.filter((r) => r._id !== id),
        }
      })
      toast('Reminder deleted', 'success')
    },
    onError: () => toast('Failed to delete reminder', 'error'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast('Please enter a reminder title', 'error')
      return
    }
    if (!formData.dueDate) {
      toast('Please select a due date and time', 'error')
      return
    }
    createMutation.mutate({
      ...formData,
      subjectId: formData.subjectId || undefined,
    })
  }

  // Filtered list
  const filtered = reminders.filter((r) => {
    if (activeFilter === 'pending') return !r.isCompleted
    if (activeFilter === 'completed') return r.isCompleted
    if (activeFilter === 'high') return r.priority === 'high' && !r.isCompleted
    return true
  })

  const pendingCount = reminders.filter((r) => !r.isCompleted).length
  const completedCount = reminders.filter((r) => r.isCompleted).length
  const highPriorityCount = reminders.filter((r) => r.priority === 'high' && !r.isCompleted).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* ── Top Header ── */}
      <motion.div
        {...fade}
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(145deg, #84A282 0%, #6B8F69 60%, #5E7A5C 100%)',
          border: '1px solid rgba(184, 207, 179, 0.40)',
          boxShadow: '0 4px 24px rgba(132, 162, 130, 0.30), 0 0 40px rgba(132, 162, 130, 0.12)',
        }}
      >
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(254,250,243,0.18), transparent)' }} />
        <div className="absolute right-1/4 -bottom-16 w-48 h-48 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(246,226,233,0.15), transparent)' }} />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(254,250,243,0.80)' }}>
              <Bell size={16} />
              <span>Smart Study Alerts</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: '#FEFAF3' }}>
              Academic Reminders & Deadlines
            </h1>
            <p className="text-sm max-w-xl" style={{ color: 'rgba(254,250,243,0.75)' }}>
              Stay ahead of assignment submissions, revision blocks, and exam dates with prioritized timeline alerts.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0"
            style={{ background: '#FEFAF3', color: '#4A5E49', boxShadow: '0 0 18px rgba(254,250,243,0.30)' }}
          >
            <Plus size={18} />
            <span>New Reminder</span>
          </button>
        </div>

        {/* Quick Counters Banner */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-6" style={{ borderTop: '1px solid rgba(254,250,243,0.20)' }}>
          <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(254,250,243,0.15)', border: '1px solid rgba(254,250,243,0.25)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm" style={{ background: 'rgba(254,250,243,0.20)', color: '#FEFAF3' }}>
              {pendingCount}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#FEFAF3' }}>Pending Tasks</div>
              <div className="text-[11px]" style={{ color: 'rgba(254,250,243,0.65)' }}>Awaiting completion</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(246,226,233,0.15)', border: '1px solid rgba(246,226,233,0.30)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm" style={{ background: 'rgba(246,226,233,0.20)', color: '#F6E2E9' }}>
              {highPriorityCount}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#FEFAF3' }}>High Priority</div>
              <div className="text-[11px]" style={{ color: 'rgba(254,250,243,0.65)' }}>Urgent deadlines</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(184,207,179,0.20)', border: '1px solid rgba(184,207,179,0.35)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm" style={{ background: 'rgba(184,207,179,0.25)', color: '#FEFAF3' }}>
              {completedCount}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: '#FEFAF3' }}>Completed</div>
              <div className="text-[11px]" style={{ color: 'rgba(254,250,243,0.65)' }}>Achieved milestones</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filters & List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(132,162,130,0.20)' }}>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: `All (${reminders.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'high', label: `High Priority (${highPriorityCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeFilter === f.id ? {
                  background: 'rgba(132,162,130,0.18)',
                  color: '#4A5E49',
                  border: '1px solid rgba(132,162,130,0.40)',
                  boxShadow: '0 0 8px rgba(132,162,130,0.15)',
                } : {
                  color: '#7A8E79',
                  border: '1px solid transparent',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#F5F0E8', border: '1px solid rgba(132,162,130,0.15)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center space-y-3" style={{ background: '#FFFFFF', border: '1px dashed rgba(132,162,130,0.30)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(132,162,130,0.15)', border: '1px solid rgba(132,162,130,0.30)', color: '#84A282' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>No Reminders Found</h3>
            <p className="text-xs max-w-sm mx-auto" style={{ color: '#7A8E79' }}>
              {activeFilter === 'completed'
                ? 'No completed tasks yet. Check off items as you finish them!'
                : 'All caught up! Click "New Reminder" to schedule your next study milestone.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => {
              const dateObj = new Date(r.dueDate)
              const isPast = dateObj < new Date() && !r.isCompleted

              return (
                <motion.div
                  key={r._id}
                  {...fade}
                  className="p-4 rounded-xl transition-all flex items-start justify-between gap-4 group"
                  style={{
                    background: r.isCompleted ? '#F5F0E8' : isPast ? 'rgba(192,100,90,0.06)' : '#FFFFFF',
                    border: r.isCompleted ? '1px solid rgba(132,162,130,0.15)' : isPast ? '1px solid rgba(192,100,90,0.30)' : '1px solid rgba(132,162,130,0.22)',
                    opacity: r.isCompleted ? 0.65 : 1,
                    boxShadow: r.isCompleted ? 'none' : '0 2px 8px rgba(132,162,130,0.06)',
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleMutation.mutate(r._id)}
                      className="mt-0.5 transition-colors"
                      style={{ color: r.isCompleted ? '#84A282' : '#7A8E79' }}
                      title={r.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {r.isCompleted ? (
                        <CheckCircle2 size={20} style={{ color: '#84A282' }} />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold truncate"
                          style={r.isCompleted ? { textDecoration: 'line-through', color: '#7A8E79' } : { color: '#2D3A2C' }}
                        >
                          {r.title}
                        </span>

                        {r.subjectId && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full border font-mono"
                            style={{
                              borderColor: `${r.subjectId.color || '#84A282'}40`,
                              color: r.subjectId.color || '#84A282',
                              background: `${r.subjectId.color || '#84A282'}15`,
                            }}
                          >
                            {r.subjectId.name}
                          </span>
                        )}

                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                          style={r.priority === 'high'
                            ? { background: 'rgba(192,100,90,0.12)', color: '#C0645A', border: '1px solid rgba(192,100,90,0.28)' }
                            : r.priority === 'medium'
                            ? { background: 'rgba(196,149,106,0.12)', color: '#8B5E3A', border: '1px solid rgba(196,149,106,0.28)' }
                            : { background: 'rgba(132,162,130,0.12)', color: '#5E7A5C', border: '1px solid rgba(132,162,130,0.25)' }}
                        >
                          {r.priority}
                        </span>

                        {isPast && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/20 text-danger font-bold">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs line-clamp-1" style={{ color: '#7A8E79' }}>{r.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] pt-0.5" style={{ color: '#7A8E79' }}>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={12} style={{ color: '#84A282' }} />
                          <span>{dateObj.toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={12} style={{ color: '#84A282' }} />
                          <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(r._id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete reminder"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add Reminder Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl p-5 sm:p-6 md:p-8 space-y-5 max-h-[92vh] overflow-y-auto"
              style={{ background: '#FFFFFF', border: '1px solid rgba(132,162,130,0.30)', boxShadow: '0 8px 40px rgba(132,162,130,0.20)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={20} style={{ color: '#84A282' }} />
                  <h3 className="font-display text-xl font-bold" style={{ color: '#2D3A2C' }}>Create Reminder</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: '#7A8E79' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#2D3A2C' }}>Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete OS Memory Management Quiz"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input w-full text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional details, chapter numbers, or study objectives"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Due Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Link to Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="">None (General Reminder)</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code || 'Course'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="study_task">Study Task</option>
                      <option value="assignment">Assignment Deadline</option>
                      <option value="quiz">Quiz Prep</option>
                      <option value="exam">Midterm / Final Exam</option>
                      <option value="custom">Custom Milestone</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-main"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary px-5 py-2.5 text-xs font-semibold"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Create Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
