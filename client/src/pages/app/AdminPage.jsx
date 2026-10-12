/**
 * AdminPage.jsx — Phase 10: Admin Telemetry & User Administration
 * Sage & Blush botanical aesthetic with system telemetry.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Users,
  BookOpen,
  HelpCircle,
  FileText,
  Calendar,
  Activity,
  Server,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { getAdminStats, getAdminUsers, updateUserRole } from '@/api/admin'
import { useToast } from '@/components/ui/Toast'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
}

export default function AdminPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 30000,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast(res.message, 'success')
    },
    onError: (err) => {
      toast(err?.response?.data?.error?.message || 'Failed to update user role', 'error')
    },
  })

  const telemetry = statsData?.telemetry || {}
  const system = statsData?.system || {}
  const users = usersData?.users || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <motion.div
        {...fade}
        className="relative overflow-hidden rounded-2xl border border-border p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(26,36,28,0.95) 0%, rgba(19,27,20,0.98) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck size={16} />
          <span>System Administration & Telemetry</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-text-main">
          Admin Control Center
        </h1>
        <p className="text-sm text-text-secondary max-w-xl mt-1">
          Monitor platform metrics, AI service throughput, storage statistics, and student user accounts.
        </p>
      </motion.div>

      {/* ── Telemetry Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Registered Students', val: telemetry.totalUsers, icon: Users, color: '#84A282' },
          { label: 'Enrolled Subjects', val: telemetry.totalSubjects, icon: BookOpen, color: '#B8CFB3' },
          { label: 'Quizzes Generated', val: telemetry.totalQuizzes, icon: HelpCircle, color: '#F6E2E9' },
          { label: 'Embedded Documents', val: telemetry.totalDocuments, icon: FileText, color: '#84A282' },
          { label: 'Academic Records', val: telemetry.totalRecords, icon: Activity, color: '#B8CFB3' },
          { label: 'Study Plans', val: telemetry.totalStudyPlans, icon: Calendar, color: '#F6E2E9' },
          { label: 'Active Reminders', val: telemetry.totalReminders, icon: Clock, color: '#84A282' },
          { label: 'System Health', val: 'Online (200)', icon: CheckCircle2, color: '#84A282' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 shadow-sm"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${item.color}15`,
                border: `1px solid ${item.color}35`,
                color: item.color,
              }}
            >
              <item.icon size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-text-main font-mono">
                {statsLoading ? '…' : item.val ?? 0}
              </div>
              <div className="text-[11px] text-text-muted">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── System Diagnostics ── */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-text-main flex items-center gap-2">
          <Server size={18} className="text-accent" />
          <span>Core Infrastructure Diagnostics</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-elevated/50 border border-border space-y-1">
            <span className="text-[11px] text-text-muted">LLM Provider</span>
            <p className="text-xs font-bold text-text-main font-mono uppercase">
              {system.provider || 'gemini'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-elevated/50 border border-border space-y-1">
            <span className="text-[11px] text-text-muted">Inference Model</span>
            <p className="text-xs font-bold text-text-main font-mono">
              {system.model || 'gemini-flash-latest'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-elevated/50 border border-border space-y-1">
            <span className="text-[11px] text-text-muted">Embedding Engine</span>
            <p className="text-xs font-bold text-text-main font-mono">
              {system.embeddingModel || 'text-embedding-004'}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-elevated/50 border border-border space-y-1">
            <span className="text-[11px] text-text-muted">Process Uptime</span>
            <p className="text-xs font-bold text-text-main font-mono">
              {Math.floor((system.uptimeSeconds || 0) / 60)} minutes
            </p>
          </div>
        </div>
      </div>

      {/* ── Registered Users Table ── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden space-y-0">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-text-main">Registered Students</h3>
            <p className="text-xs text-text-muted">Manage roles and review academic activity.</p>
          </div>
          <span className="text-xs font-mono text-accent font-semibold px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25">
            {users.length} Total Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-raised border-b border-border text-text-muted uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Degree / Course</th>
                <th className="px-5 py-3">Subjects</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-raised/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-text-main">
                      {u.displayName || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary font-mono">{u.email}</td>
                    <td className="px-5 py-3.5 text-text-muted">{u.course || '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-accent">{u.subjectCount}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-accent-blush/20 text-accent-blush border border-accent-blush/30'
                            : 'bg-accent/15 text-accent border border-accent/25'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() =>
                          roleMutation.mutate({
                            id: u.id,
                            role: u.role === 'admin' ? 'student' : 'admin',
                          })
                        }
                        disabled={roleMutation.isPending}
                        className="px-2.5 py-1 rounded-lg bg-elevated hover:bg-elevated/80 border border-border text-[11px] font-semibold text-text-secondary hover:text-text-main transition-all"
                      >
                        {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
