import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BookOpen, Award, Layers, FileCheck, ArrowRight, Plus,
  MessageSquare, Sparkles, User, TrendingUp,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { getDashboardStats } from '@/api/dashboard'
import { auth } from '@/firebase'
import { useAuth } from '@/context/AuthContext'
import ProgressRing from '@/components/ui/ProgressRing'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { getSafeDisplayName } from '@/utils/phoneUtils'

// Botanical chart colors
const CHART_COLORS = ['#84A282', '#B8CFB3', '#5E7A5C', '#A8C2A6', '#C4E0C2']

export default function DashboardPage() {
  const { user, profile: authProfile } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.uid],
    queryFn: async () => {
      try {
        return await getDashboardStats()
      } catch (err) {
        console.warn('Dashboard fetch bypassed:', err)
        return {
          stats: {
            totalSubjects: 0,
            totalAssessments: 0,
            overallAverage: 0,
            overallSyllabusProgress: 0,
            totalTopics: 0,
            completedTopics: 0,
          },
          subjects: [],
          recentRecords: [],
          profile: {
            displayName: getSafeDisplayName(user, null, 'Scholar'),
            avatarUrl: user?.photoURL || '',
          },
        }
      }
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-card" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-card" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-card lg:col-span-2" />
          <Skeleton className="h-80 w-full rounded-card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12" style={{ borderColor: 'rgba(192,100,90,0.3)' }}>
        <p className="font-semibold" style={{ color: '#C0645A' }}>Failed to load dashboard</p>
        <p className="text-xs mt-1" style={{ color: '#7A8E79' }}>{error.message}</p>
      </div>
    )
  }

  const { stats, subjects = [], recentRecords = [], profile } = data || {}
  const hasSubjects = subjects && subjects.length > 0

  const chartData = subjects.map((s, i) => ({
    name: s.code || s.name.substring(0, 8),
    fullName: s.name,
    score: s.averagePercent !== null ? s.averagePercent : 0,
    hasData: s.averagePercent !== null,
    progress: s.syllabusProgress,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const currentProfile = authProfile || profile
  const displayName = getSafeDisplayName(user, currentProfile, 'Scholar')
  const hasAvatar = !!currentProfile?.avatarUrl
  const avatarUrl = currentProfile?.avatarUrl || ''
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-card p-4 sm:p-6 md:p-8"
        style={{
          background: 'linear-gradient(145deg, #84A282 0%, #6B8F69 60%, #5E7A5C 100%)',
          border: '1px solid rgba(184, 207, 179, 0.40)',
          boxShadow: '0 4px 24px rgba(132, 162, 130, 0.30), 0 0 40px rgba(132, 162, 130, 0.12)',
        }}
      >
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(254, 250, 243, 0.20), transparent)' }}
        />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(246, 226, 233, 0.15), transparent)' }}
        />
        <div className="pointer-events-none absolute right-1/4 top-0 h-24 w-24 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(184, 207, 179, 0.25), transparent)' }}
        />

        <div className="relative flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <Link to="/app/profile" title="Edit profile">
              <div
                className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden flex items-center justify-center text-base font-bold shrink-0 transition-transform hover:scale-105"
                style={{
                  background: hasAvatar ? undefined : 'rgba(254, 250, 243, 0.25)',
                  border: '2px solid rgba(254, 250, 243, 0.50)',
                  color: '#FEFAF3',
                  boxShadow: '0 0 16px rgba(254, 250, 243, 0.25)',
                }}
              >
                {hasAvatar ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.25)' }}
                >
                  <User size={16} style={{ color: '#FEFAF3' }} />
                </div>
              </div>
            </Link>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: 'rgba(254, 250, 243, 0.20)' }}
                >
                  <Sparkles size={11} style={{ color: '#FEFAF3' }} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: 'rgba(254,250,243,0.80)' }}>
                  Academic Command Center
                </span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold md:text-3xl truncate" style={{ color: '#FEFAF3' }}>
                Welcome back, {displayName.split(' ')[0]}!
              </h1>
              <p className="text-xs sm:text-sm line-clamp-2" style={{ color: 'rgba(254,250,243,0.75)' }}>
                {profile?.course ? (
                  <>
                    {profile.course}
                    {profile.semester ? ` • Semester ${profile.semester}` : ''}
                    {profile.institution ? ` • ${profile.institution}` : ''}
                  </>
                ) : (
                  'Track syllabus mastery, exam scores, and get AI-powered study guidance.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <Link to="/app/profile">
              <button
                className="flex items-center gap-1.5 rounded-btn px-3 py-2 text-xs font-medium min-h-[38px] transition-all"
                style={{
                  background: 'rgba(254, 250, 243, 0.18)',
                  border: '1px solid rgba(254, 250, 243, 0.35)',
                  color: '#FEFAF3',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(254,250,243,0.28)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(254,250,243,0.18)' }}
              >
                <User size={13} />
                Edit Profile
              </button>
            </Link>
            <Link to="/app/chat">
              <button
                className="flex items-center gap-1.5 rounded-btn px-3.5 sm:px-4 py-2 text-xs font-semibold min-h-[38px] transition-all"
                style={{
                  background: '#FEFAF3',
                  border: '1px solid rgba(254, 250, 243, 0.80)',
                  color: '#4A5E49',
                  boxShadow: '0 0 18px rgba(254, 250, 243, 0.30)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 24px rgba(254,250,243,0.45)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 18px rgba(254,250,243,0.30)' }}
              >
                <MessageSquare size={13} />
                Ask AI Advisor
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Total Subjects',
            value: stats?.totalSubjects ?? 0,
            icon: BookOpen,
            sub: 'Active Courses',
            color: '#84A282',
            bg: 'rgba(132, 162, 130, 0.15)',
            border: 'rgba(132, 162, 130, 0.30)',
          },
          {
            label: 'Average Score',
            value: stats?.overallAverage ? `${stats.overallAverage}%` : 'N/A',
            icon: Award,
            sub: stats?.overallAverage >= 80 ? 'Distinction' : stats?.overallAverage >= 60 ? 'Good standing' : 'Keep pushing',
            color: '#5E7A5C',
            bg: 'rgba(94, 122, 92, 0.12)',
            border: 'rgba(94, 122, 92, 0.25)',
          },
          {
            label: 'Syllabus Done',
            value: `${stats?.overallSyllabusProgress ?? 0}%`,
            icon: Layers,
            sub: `${stats?.completedTopics ?? 0} of ${stats?.totalTopics ?? 0} topics`,
            color: '#A8C2A6',
            bg: 'rgba(168, 194, 166, 0.20)',
            border: 'rgba(184, 207, 179, 0.40)',
          },
          {
            label: 'Assessments',
            value: stats?.totalAssessments ?? 0,
            icon: FileCheck,
            sub: 'Exams & Quizzes',
            color: '#8B4A5E',
            bg: 'rgba(246, 226, 233, 0.35)',
            border: 'rgba(246, 226, 233, 0.60)',
          },
        ].map(({ label, value, icon: Icon, sub, color, bg, border }) => (
          <div
            key={label}
            className="rounded-card p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3 transition-all hover:shadow-glow"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${border}`,
              boxShadow: '0 2px 12px rgba(132, 162, 130, 0.08)',
            }}
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: bg }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium truncate" style={{ color: '#7A8E79' }}>{label}</p>
              <h3 className="font-display text-xl font-bold" style={{ color: '#2D3A2C' }}>{value}</h3>
              <p className="text-[10px] truncate" style={{ color: '#7A8E79' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {!hasSubjects ? (
        /* ── Empty State ─────────────────────────────────────────── */
        <div
          className="rounded-card text-center py-16"
          style={{ background: '#FFFFFF', border: '1px dashed rgba(132, 162, 130, 0.35)' }}
        >
          <EmptyState
            icon={BookOpen}
            title="Start your academic journey"
            description="Add your first subjects, track syllabus units, and log examination scores to unlock AI analysis."
            action={
              <Link to="/app/subjects" className="mt-4 inline-block">
                <button className="btn-primary flex items-center gap-2">
                  <Plus size={16} />
                  Add Subjects Now
                </button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* ── Middle Row: Chart & Mastery Ring ─────────────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Bar Chart */}
            <div
              className="rounded-card p-5 lg:col-span-2 flex flex-col"
              style={{ background: '#FFFFFF', border: '1px solid rgba(132, 162, 130, 0.20)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>
                    Subject Performance
                  </h2>
                  <p className="text-xs" style={{ color: '#7A8E79' }}>
                    Average percentage across recorded assessments
                  </p>
                </div>
                <Link
                  to="/app/subjects"
                  className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: '#84A282' }}
                >
                  Manage <ArrowRight size={13} />
                </Link>
              </div>

              {chartData.some((d) => d.hasData) ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 162, 130, 0.12)" />
                      <XAxis dataKey="name" stroke="#7A8E79" fontSize={11} tickLine={false} />
                      <YAxis stroke="#7A8E79" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FEFAF3',
                          borderColor: 'rgba(132, 162, 130, 0.30)',
                          borderRadius: '10px',
                          color: '#2D3A2C',
                          fontSize: '12px',
                          boxShadow: '0 4px 16px rgba(132, 162, 130, 0.15)',
                        }}
                        formatter={(val, name, item) => [`${val}%`, item.payload.fullName]}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div
                  className="flex h-52 flex-col items-center justify-center rounded-xl border text-center p-6"
                  style={{ borderColor: 'rgba(132, 162, 130, 0.20)', borderStyle: 'dashed', color: '#7A8E79' }}
                >
                  <FileCheck size={28} className="mb-2 opacity-40" />
                  <p className="text-xs">No assessments logged yet.</p>
                  <Link to="/app/subjects" className="mt-2 text-xs hover:underline" style={{ color: '#84A282' }}>
                    + Log an exam or quiz score
                  </Link>
                </div>
              )}
            </div>

            {/* Circular Mastery Card */}
            <div
              className="rounded-card p-5 flex flex-col justify-between"
              style={{ background: '#FFFFFF', border: '1px solid rgba(184, 207, 179, 0.35)' }}
            >
              <div>
                <h2 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>
                  Syllabus Mastery
                </h2>
                <p className="text-xs" style={{ color: '#7A8E79' }}>
                  Completion across all curricula
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-6">
                <ProgressRing
                  value={stats?.overallSyllabusProgress ?? 0}
                  max={100}
                  size={120}
                  strokeWidth={9}
                  color="#84A282"
                  label={`${stats?.overallSyllabusProgress ?? 0}%`}
                />
                <p className="mt-3 text-xs font-semibold" style={{ color: '#2D3A2C' }}>
                  {stats?.completedTopics ?? 0} of {stats?.totalTopics ?? 0} topics completed
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#7A8E79' }}>
                  {(stats?.totalTopics - stats?.completedTopics) > 0
                    ? `${stats.totalTopics - stats.completedTopics} topics remaining`
                    : 'All topics checked off! 🎉'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(132, 162, 130, 0.15)', paddingTop: '12px' }}>
                <Link
                  to="/app/subjects"
                  className="flex items-center justify-between text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: '#84A282' }}
                >
                  <span>Review topic checklists</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Bottom Row: Subjects + Recent Assessments ──────────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Enrolled Subjects */}
            <div
              className="rounded-card p-5 lg:col-span-2 space-y-4"
              style={{ background: '#FFFFFF', border: '1px solid rgba(132, 162, 130, 0.20)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>
                    Enrolled Courses
                  </h2>
                  <p className="text-xs" style={{ color: '#7A8E79' }}>
                    Subject progress and target performance
                  </p>
                </div>
                <Link to="/app/subjects" className="flex items-center gap-1 text-xs font-medium hover:opacity-80" style={{ color: '#84A282' }}>
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {subjects.slice(0, 6).map((sub, i) => {
                  const color = sub.color || CHART_COLORS[i % CHART_COLORS.length]
                  return (
                    <div
                      key={sub._id}
                      className="rounded-xl p-4 transition-all hover:shadow-glow-sm"
                      style={{
                        background: '#FEFAF3',
                        border: '1px solid rgba(132, 162, 130, 0.18)',
                        borderLeft: `4px solid ${color}`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm line-clamp-1" style={{ color: '#2D3A2C' }}>
                            {sub.name}
                          </h3>
                          <p className="font-mono text-[11px]" style={{ color: '#7A8E79' }}>
                            {sub.code || 'NO-CODE'} • {sub.credits} Credits
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${color}25`, color, border: `1px solid ${color}55` }}
                        >
                          Target {sub.targetGrade}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-[11px]" style={{ color: '#7A8E79' }}>
                          <span>Syllabus: {sub.completedTopics}/{sub.totalTopics}</span>
                          <span className="font-semibold" style={{ color: '#2D3A2C' }}>{sub.syllabusProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(132,162,130,0.15)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${sub.syllabusProgress}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>

                      <div
                        className="mt-3 flex items-center justify-between pt-2 text-[11px]"
                        style={{ borderTop: '1px solid rgba(132,162,130,0.12)', color: '#7A8E79' }}
                      >
                        <span>Assessments: {sub.assessmentsCount}</span>
                        <span className="font-semibold" style={{ color: '#4A5E49' }}>
                          {sub.averagePercent !== null ? `Avg: ${sub.averagePercent}%` : 'No scores'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Assessments */}
            <div
              className="rounded-card p-5 flex flex-col justify-between"
              style={{ background: '#FFFFFF', border: '1px solid rgba(132, 162, 130, 0.20)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-base font-bold" style={{ color: '#2D3A2C' }}>
                    Recent Assessments
                  </h2>
                  <Link to="/app/subjects" className="text-xs font-medium hover:opacity-80" style={{ color: '#84A282' }}>
                    View →
                  </Link>
                </div>

                {recentRecords.length > 0 ? (
                  <div style={{ borderTop: '1px solid rgba(132, 162, 130, 0.12)' }}>
                    {recentRecords.map((rec) => (
                      <div
                        key={rec._id}
                        className="py-2.5 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(132, 162, 130, 0.08)' }}
                      >
                        <div className="space-y-0.5 pr-2">
                          <p className="font-medium text-xs line-clamp-1" style={{ color: '#2D3A2C' }}>
                            {rec.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#7A8E79' }}>
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: rec.subjectColor || '#84A282' }}
                            />
                            <span>{rec.subjectName}</span>
                            <span>•</span>
                            <span className="capitalize">{rec.type}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: rec.percentage >= 75 ? '#84A282' : rec.percentage >= 50 ? '#C4956A' : '#C0645A',
                            }}
                          >
                            {rec.score}/{rec.totalMarks}
                          </span>
                          <p className="text-[10px]" style={{ color: '#7A8E79' }}>
                            {new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs" style={{ color: '#7A8E79' }}>
                    <FileCheck size={24} className="mx-auto mb-2 opacity-40" />
                    No assessments recorded yet.
                    <div className="mt-3">
                      <Link to="/app/subjects">
                        <button className="btn-secondary text-xs px-3 py-1.5">
                          + Log Score
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Advisor Insight */}
              <div
                className="mt-4 rounded-xl p-3"
                style={{
                  background: 'rgba(184, 207, 179, 0.20)',
                  border: '1px solid rgba(132, 162, 130, 0.30)',
                  boxShadow: '0 0 12px rgba(132, 162, 130, 0.10)',
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#5E7A5C' }}>
                  <Sparkles size={13} />
                  <span>AI Advisor Insight</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#4A5E49' }}>
                  {(stats?.overallSyllabusProgress ?? 0) < 30
                    ? 'Start building early momentum! Review your lowest progress subjects and generate a quiz.'
                    : 'Great pace! Use the AI Study Planner to schedule focused blocks before midterms.'}
                </p>
                <div className="mt-2 text-right">
                  <Link to="/app/chat" className="text-[11px] font-medium hover:underline" style={{ color: '#84A282' }}>
                    Open AI Chat →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
