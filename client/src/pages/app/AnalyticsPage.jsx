/**
 * AnalyticsPage.jsx — Phase 8: Strength & Weakness Analytics
 * Visualises academic mastery, quiz accuracy, syllabus completion, missed topics,
 * score distribution, and AI-powered diagnosis — all in the warm earthy palette.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BookOpen,
  Target,
  BarChart3,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAnalyticsData, getAiDiagnosis } from '@/api/analytics'
import { useToast } from '@/components/ui/Toast'

// ── Helpers ────────────────────────────────────────────────────────────────────
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

function TrendIcon({ trend, size = 14 }) {
  if (trend === 'improving') return <TrendingUp size={size} className="text-success" />
  if (trend === 'declining')  return <TrendingDown size={size} className="text-danger" />
  return <Minus size={size} className="text-text-muted" />
}

function RingProgress({ pct, size = 72, stroke = 6, color = '#84A282', bg = 'rgba(132, 162, 130, 0.18)' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

function StatCard({ label, value, unit = '%', sub, color = '#84A282', icon: Icon }) {
  return (
    <div className="relative flex flex-col gap-2 rounded-card bg-surface border border-border p-4 shadow-card overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle at top right, ${color}22 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        {Icon && <Icon size={16} className="text-text-muted" />}
      </div>
      <div className="flex items-end gap-1">
        <span className="font-display text-3xl font-bold" style={{ color }}>{value ?? '—'}</span>
        {value !== null && value !== undefined && <span className="text-sm text-text-muted mb-1">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

const SKILL_COLORS = ['#84A282', '#B8CFB3', '#5E7A5C', '#C08A9A', '#9B7E8A', '#6B8F69']

// ── AI Diagnosis Drawer ────────────────────────────────────────────────────────
function DiagnosisDrawer({ onClose }) {
  const { toast } = useToast()
  const { data: diagnosis, isLoading, isError } = useQuery({
    queryKey: ['ai-diagnosis'],
    queryFn: getAiDiagnosis,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-surface border-l border-border-strong shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-elevated/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-text-main">AI Academic Diagnosis</h2>
            <p className="text-xs text-text-muted">Powered by Gemini · Grounded in your data</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-raised hover:text-text-main transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="relative h-14 w-14">
              <RingProgress pct={60} size={56} color="#84A282" />
              <Brain size={20} className="absolute inset-0 m-auto text-accent animate-pulse" />
            </div>
            <p className="text-sm text-text-muted animate-pulse">Analysing your academic profile…</p>
          </div>
        )}

        {isError && (
          <div className="rounded-card border border-danger/30 bg-danger/10 p-4 text-center">
            <AlertTriangle size={24} className="mx-auto text-danger mb-2" />
            <p className="text-sm text-text-secondary">Failed to generate diagnosis. Please try again.</p>
          </div>
        )}

        {diagnosis && !isLoading && (
          <motion.div {...fade} className="space-y-5">
            {/* Headline */}
            <div className="rounded-card border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-semibold text-accent">{diagnosis.headline}</p>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Analysis Summary</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{diagnosis.summary}</p>
            </div>

            {/* Strengths */}
            {diagnosis.keyStrengths?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-success">Key Strengths</h3>
                <ul className="space-y-1.5">
                  {diagnosis.keyStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Gaps */}
            {diagnosis.criticalGaps?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-warning">Critical Gaps</h3>
                <ul className="space-y-1.5">
                  {diagnosis.criticalGaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {diagnosis.actionPlan?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Action Plan</h3>
                <div className="space-y-2">
                  {diagnosis.actionPlan.map((item, i) => (
                    <div key={i} className="rounded-card border border-border bg-raised p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-main">{item.subject}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          item.priority === 'High' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                        }`}>{item.priority}</span>
                      </div>
                      <p className="text-xs text-text-secondary">{item.action}</p>
                      <p className="text-xs text-accent">📌 {item.technique}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Strategy */}
            {diagnosis.studyStrategy && (
              <div className="rounded-card border border-primary/40 bg-elevated/60 p-4 space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Recommended Study Strategy</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{diagnosis.studyStrategy}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ── Custom Recharts Tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-card border border-border bg-raised shadow-xl px-3 py-2 text-xs">
      <p className="font-semibold text-text-main mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>{entry.name}: {entry.value}{entry.unit || '%'}</p>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { toast } = useToast()
  const [showDiagnosis, setShowDiagnosis] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsData,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="relative h-20 w-20">
          <RingProgress pct={60} size={80} stroke={7} color="#84A282" />
          <BarChart3 size={26} className="absolute inset-0 m-auto text-accent animate-pulse" />
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading your academic analytics…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle size={36} className="text-warning" />
        <h2 className="font-display text-xl font-bold text-text-main">Could not load analytics</h2>
        <p className="text-sm text-text-muted max-w-xs">
          {data === null ? 'No data yet — add subjects, assessments, and take quizzes to see your analytics.' : 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 rounded-btn border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const { overview, subjects, strengths, weaknesses, missedTopics, scoreDistribution, timeline, profile } = data

  // Radar chart data — subject composite scores
  const radarData = subjects.slice(0, 7).map((s) => ({
    subject: s.name.length > 10 ? s.name.substring(0, 10) + '…' : s.name,
    score: s.compositeScore ?? 0,
    syllabus: s.syllabusProgress ?? 0,
  }))

  // Timeline chart (last 12 events)
  const timelineChart = timeline?.slice(-12).map((e, i) => ({
    name: `${i + 1}`,
    score: e.percentage,
    subject: e.subjectName,
    label: e.title,
  })) || []

  // Score distribution for bar chart
  const distChart = scoreDistribution?.filter((d) => d.count > 0).map((d) => ({
    grade: d.grade.split(' ')[0],
    count: d.count,
    fill: d.color,
  })) || []

  // Per-subject for horizontal bar
  const subjectBarData = subjects.map((s) => ({
    name: s.name.length > 14 ? s.name.substring(0, 14) + '…' : s.name,
    Academic: s.academicAvg ?? 0,
    Quiz: s.quizAvg ?? 0,
    Syllabus: s.syllabusProgress ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div {...fade} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-main">
            Strength &amp; Weakness Analytics
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {profile?.displayName ? `${profile.displayName}'s` : 'Your'} comprehensive academic performance breakdown
          </p>
        </div>
        <button
          onClick={() => setShowDiagnosis(true)}
          className="flex items-center gap-2 rounded-btn bg-elevated border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10 hover:border-accent transition-all shadow-glow-xs"
        >
          <Sparkles size={15} />
          AI Diagnosis
          <ChevronRight size={14} />
        </button>
      </motion.div>

      {/* ── Overview Stat Cards ── */}
      <motion.div {...fade} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Academic Avg" value={overview.overallAverage || null} color="#84A282" icon={Target} sub={`${overview.totalAssessments} records`} />
        <StatCard label="Quiz Accuracy" value={overview.quizAverage || null} color="#B8CFB3" icon={Zap} sub={`${overview.totalQuizzesTaken} quizzes`} />
        <StatCard label="Composite Mastery" value={overview.compositeMastery || null} color="#5E7A5C" icon={BarChart3} sub="60% records + 40% quizzes" />
        <StatCard label="Syllabus Done" value={overview.syllabusCompletion} color="#84A282" icon={BookOpen} sub="Topics completed" />
        <StatCard label="Study Adherence" value={overview.studyPlanAdherence} color="#C08A9A" icon={CheckCircle2} sub="Plan tasks done" />
        <StatCard label="Subjects" value={overview.totalSubjects} unit="" color="#B8CFB3" icon={Brain} sub={`${overview.strongSubjectsCount} strong · ${overview.weakSubjectsCount} weak`} />
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Radar Chart — Skills Matrix */}
        <motion.div {...fade} className="lg:col-span-1 rounded-card bg-surface border border-border p-5 shadow-card flex flex-col gap-3">
          <h2 className="font-display text-sm font-bold text-text-main">Subject Skills Radar</h2>
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(132, 162, 130, 0.20)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A5E49', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#84A282" fill="#84A282" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Syllabus" dataKey="syllabus" stroke="#B8CFB3" fill="#B8CFB3" fillOpacity={0.20} strokeWidth={1.5} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10 text-center">
              <p className="text-xs text-text-muted">Add 3+ subjects with records to see the radar</p>
            </div>
          )}
          <div className="flex items-center gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sage inline-block" /> Score</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-laurel inline-block" /> Syllabus %</span>
          </div>
        </motion.div>

        {/* Performance Timeline */}
        <motion.div {...fade} className="lg:col-span-2 rounded-card bg-surface border border-border p-5 shadow-card flex flex-col gap-3">
          <h2 className="font-display text-sm font-bold text-text-main">Score Timeline</h2>
          {timelineChart.length > 1 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 162, 130, 0.15)" />
                <XAxis dataKey="name" tick={{ fill: '#7A8E79', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7A8E79', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="score" stroke="#84A282" strokeWidth={2.5}
                  dot={{ fill: '#84A282', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#5E7A5C' }}
                  unit="%"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10">
              <p className="text-xs text-text-muted text-center">Complete assessments and quizzes to see your score timeline</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Subject Comparison Bar Chart ── */}
      <motion.div {...fade} className="rounded-card bg-surface border border-border p-5 shadow-card space-y-3">
        <h2 className="font-display text-sm font-bold text-text-main">Per-Subject Performance Breakdown</h2>
        {subjectBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectBarData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 162, 130, 0.15)" />
              <XAxis dataKey="name" tick={{ fill: '#7A8E79', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#7A8E79', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#4A5E49' }} />
              <Bar dataKey="Academic" fill="#84A282" radius={[4, 4, 0, 0]} name="Academic Avg" unit="%" />
              <Bar dataKey="Quiz" fill="#B8CFB3" radius={[4, 4, 0, 0]} name="Quiz Avg" unit="%" />
              <Bar dataKey="Syllabus" fill="#E898A5" radius={[4, 4, 0, 0]} name="Syllabus %" unit="%" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center">
            <p className="text-xs text-text-muted">No subjects found — add subjects to start tracking</p>
          </div>
        )}
      </motion.div>

      {/* ── Strengths & Weaknesses + Score Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Strengths */}
        <motion.div {...fade} className="rounded-card bg-surface border border-border p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-success" />
            <h2 className="font-display text-sm font-bold text-text-main">Strengths</h2>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-raised px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color || '#84A282' }} />
                    <span className="text-xs font-medium text-text-secondary truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-success">{s.score}%</span>
                    <TrendIcon trend={s.trend} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted text-center py-6">No strong subjects identified yet.<br />Complete more assessments to unlock.</p>
          )}
        </motion.div>

        {/* Weaknesses / Risk Areas */}
        <motion.div {...fade} className="rounded-card bg-surface border border-border p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-warning" />
            <h2 className="font-display text-sm font-bold text-text-main">Risk Areas</h2>
          </div>
          {weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: w.color || '#C0645A' }} />
                      <span className="text-xs font-medium text-text-secondary truncate">{w.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-danger">{w.score}%</span>
                      <TrendIcon trend={w.trend} />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted pl-4">{w.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted text-center py-6">No risk areas! Keep up the great work.</p>
          )}
        </motion.div>

        {/* Score Distribution Pie */}
        <motion.div {...fade} className="rounded-card bg-surface border border-border p-5 shadow-card space-y-3">
          <h2 className="font-display text-sm font-bold text-text-main">Score Distribution</h2>
          {distChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={distChart} dataKey="count" nameKey="grade"
                    cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    paddingAngle={3} strokeWidth={0}
                  >
                    {distChart.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-card border border-border bg-raised px-3 py-2 text-xs">
                          <p className="font-semibold text-text-main">{payload[0].payload.grade}</p>
                          <p className="text-text-muted">{payload[0].value} assessment{payload[0].value !== 1 ? 's' : ''}</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1">
                {scoreDistribution.filter((d) => d.count > 0).map((d, i) => (
                  <li key={i} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-text-muted">{d.grade}</span>
                    </span>
                    <span className="font-semibold text-text-secondary">{d.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-xs text-text-muted">Complete assessments to populate score distribution</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Missed Quiz Topics ── */}
      {missedTopics?.length > 0 && (
        <motion.div {...fade} className="rounded-card bg-surface border border-border p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-text-muted" />
            <h2 className="font-display text-sm font-bold text-text-main">Frequently Missed Quiz Topics</h2>
            <span className="ml-auto text-xs text-text-muted">Focus here first</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {missedTopics.map((t, i) => (
              <div key={i} className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-text-secondary truncate">{t.topic}</span>
                  <span className="shrink-0 rounded-full bg-danger/20 px-1.5 py-0.5 text-[10px] font-bold text-danger">{t.missCount}×</span>
                </div>
                <p className="text-[10px] text-text-muted">{t.subjectName}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Subject Detail Cards ── */}
      <motion.div {...fade} className="space-y-3">
        <h2 className="font-display text-base font-bold text-text-main">Course-by-Course Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div
              key={s._id}
              className={`rounded-card border p-4 shadow-card space-y-3 ${
                s.status === 'weak' ? 'border-danger/30 bg-danger/5' :
                s.status === 'strong' ? 'border-success/25 bg-success/5' :
                'border-border bg-surface'
              }`}
            >
              {/* Subject header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-main truncate">{s.name}</h3>
                    <p className="text-[10px] text-text-muted">{s.code} · {s.credits} cr · Target: {s.targetGrade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'strong' ? 'bg-success/20 text-success' :
                    s.status === 'weak'   ? 'bg-danger/20 text-danger' :
                    s.status === 'moderate' ? 'bg-warning/20 text-warning' :
                    'bg-elevated text-text-muted'
                  }`}>{s.status}</span>
                  <TrendIcon trend={s.trend} />
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Academic', val: s.academicAvg, color: '#84A282' },
                  { label: 'Quiz', val: s.quizAvg, color: '#5E7A5C' },
                  { label: 'Syllabus', val: s.syllabusProgress, color: '#B8CFB3' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-xl bg-raised border border-border p-2">
                    <p className="font-bold text-sm" style={{ color }}>{val !== null && val !== undefined ? `${val}%` : '—'}</p>
                    <p className="text-[10px] text-text-muted">{label}</p>
                  </div>
                ))}
              </div>

              {/* Syllabus progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                  <span>Syllabus</span>
                  <span>{s.completedTopics}/{s.totalTopics} topics</span>
                </div>
                <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#B8CFB3' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.syllabusProgress || 0}%` }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span>{s.assessmentsCount} records</span>
                <span>·</span>
                <span>{s.quizzesCount} quizzes</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Diagnosis Drawer */}
      <AnimatePresence>
        {showDiagnosis && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDiagnosis(false)}
            />
            <DiagnosisDrawer onClose={() => setShowDiagnosis(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
