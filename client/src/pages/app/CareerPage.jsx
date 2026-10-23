/**
 * CareerPage.jsx — Phase 9: Career Guidance & Pathways
 * AI-powered career matching, milestone roadmaps, skill gap evaluation,
 * and industry readiness grounded in student coursework and strengths.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  RefreshCw,
  Sliders,
  X,
  Target,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  getCareerGuidance,
  generateRecommendations,
  updateCareerPreferences,
  toggleBookmarkRole,
  analyzeSkillGap,
} from '@/api/career'
import { useToast } from '@/components/ui/Toast'

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

function MatchRing({ pct = 85, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 90 ? '#84A282' : pct >= 80 ? '#B8CFB3' : '#C08A9A'

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(132,162,130,0.20)" strokeWidth={stroke} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center leading-tight">
        <span className="text-xs font-bold text-text-main font-mono">{pct}%</span>
      </div>
    </div>
  )
}

export default function CareerPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('pathways') // 'pathways' | 'gap' | 'saved'
  const [selectedRole, setSelectedRole] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [customRoleInput, setCustomRoleInput] = useState('')

  // Query: load career guidance data
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['career-guidance'],
    queryFn: getCareerGuidance,
  })

  const careerPlan = data?.careerPlan || {}
  const studentProfile = data?.studentProfile || {}
  const academicSummary = data?.academicSummary || {}
  const recommendations = careerPlan.recommendations || []
  const bookmarkedRoles = careerPlan.bookmarkedRoles || []
  const skillGapAnalysis = careerPlan.skillGapAnalysis || {}

  // Mutation: Regenerate recommendations
  const regenMutation = useMutation({
    mutationFn: generateRecommendations,
    onSuccess: (res) => {
      queryClient.setQueryData(['career-guidance'], (old) => ({
        ...old,
        careerPlan: res.careerPlan,
      }))
      toast('Career recommendations updated successfully!', 'success')
      setShowConfigModal(false)
    },
    onError: (err) => {
      toast(err?.response?.data?.error?.message || 'Failed to update recommendations', 'error')
    },
  })

  // Mutation: Toggle Bookmark
  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmarkRole,
    onSuccess: (res) => {
      queryClient.setQueryData(['career-guidance'], (old) => {
        if (!old) return old
        return {
          ...old,
          careerPlan: {
            ...old.careerPlan,
            bookmarkedRoles: res.bookmarkedRoles,
          },
        }
      })
      toast(res.message, 'success')
    },
    onError: () => toast('Failed to update bookmark', 'error'),
  })

  // Mutation: Analyze Skill Gap
  const gapMutation = useMutation({
    mutationFn: analyzeSkillGap,
    onSuccess: (res) => {
      queryClient.setQueryData(['career-guidance'], (old) => {
        if (!old) return old
        return {
          ...old,
          careerPlan: {
            ...old.careerPlan,
            skillGapAnalysis: res.skillGapAnalysis,
          },
        }
      })
      setActiveTab('gap')
      toast(`Skill gap analysis ready for ${res.skillGapAnalysis.targetRole}`, 'success')
    },
    onError: (err) => {
      toast(err?.response?.data?.error?.message || 'Failed to analyze skill gap', 'error')
    },
  })

  // Aspirations form state
  const [formData, setFormData] = useState({
    targetRole: '',
    targetIndustry: 'Technology & Software',
    experienceLevel: 'Entry-Level / Graduate',
    workStyle: 'Hybrid',
    customInterests: '',
  })

  const openConfig = () => {
    setFormData({
      targetRole: careerPlan.targetRole || '',
      targetIndustry: careerPlan.targetIndustry || 'Technology & Software',
      experienceLevel: careerPlan.experienceLevel || 'Entry-Level / Graduate',
      workStyle: careerPlan.workStyle || 'Hybrid',
      customInterests: (careerPlan.customInterests || []).join(', '),
    })
    setShowConfigModal(true)
  }

  const handleConfigSubmit = (e) => {
    e.preventDefault()
    regenMutation.mutate({
      targetRole: formData.targetRole.trim(),
      targetIndustry: formData.targetIndustry,
      experienceLevel: formData.experienceLevel,
      workStyle: formData.workStyle,
      customInterests: formData.customInterests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }

  const isBookmarked = (roleTitle) => {
    return bookmarkedRoles.some((b) => b.roleTitle.toLowerCase() === roleTitle.toLowerCase())
  }

  const handleDeepDive = (roleTitle) => {
    gapMutation.mutate(roleTitle)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
          <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="font-display text-xl font-bold text-text-main mb-2">Failed to load Career Guidance</h2>
        <p className="text-text-muted text-sm max-w-md mb-6">
          We encountered an issue retrieving your career roadmap. Please refresh to try again.
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold hover:bg-accent-soft transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ── Top Header Banner ── */}
      <motion.div
        {...fade}
        className="relative overflow-hidden rounded-2xl border border-border p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, #253D26 0%, #1C301E 50%, #142516 100%)',
          boxShadow: '0 8px 32px rgba(28, 48, 30, 0.50), 0 0 40px rgba(94, 122, 92, 0.18)',
          border: '1px solid rgba(184, 207, 179, 0.22)',
        }}
      >
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-48 h-48 rounded-full bg-accent-soft/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
              <Compass size={16} />
              <span>Academic-to-Career Placement Engine</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-main">
              Career Pathways & Industry Roadmaps
            </h1>
            <p className="text-sm md:text-base text-text-secondary max-w-2xl">
              Real-time career trajectories calibrated to your enrolled courses in{' '}
              <span className="text-text-main font-medium">{studentProfile.course || 'your major'}</span>{' '}
              and validated against current industry demand.
            </p>

            {/* Vision statement banner */}
            {careerPlan.careerVision && (
              <div className="mt-4 p-3.5 rounded-xl bg-elevated/70 border border-border-strong flex items-start gap-3">
                <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-text-secondary italic">
                  &ldquo;{careerPlan.careerVision}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
            <button
              onClick={openConfig}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-accent text-text-main hover:text-accent text-sm font-medium transition-all shadow-sm"
            >
              <Sliders size={16} />
              <span>Aspiration Profile</span>
            </button>
            <button
              onClick={() => regenMutation.mutate({})}
              disabled={regenMutation.isPending || isRefetching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-bg hover:bg-accent-soft text-sm font-semibold transition-all shadow-glow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={regenMutation.isPending || isRefetching ? 'animate-spin' : ''} />
              <span>{regenMutation.isPending ? 'Regenerating...' : 'Refresh Matches'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('pathways')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'pathways'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Compass size={16} />
          <span>Recommended Pathways ({recommendations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('gap')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'gap'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Target size={16} />
          <span>Skill Gap Deep Dive</span>
          {skillGapAnalysis?.targetRole && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-mono">
              {skillGapAnalysis.targetRole}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'saved'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Bookmark size={16} />
          <span>Saved Roles ({bookmarkedRoles.length})</span>
        </button>
      </div>

      {/* ── Tab Content: Pathways ── */}
      {activeTab === 'pathways' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((role, idx) => {
              const bookmarked = isBookmarked(role.roleTitle)
              const isExpanded = expandedCard === idx

              return (
                <motion.div
                  key={role.roleTitle}
                  {...fade}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-2xl bg-card border border-border p-6 flex flex-col justify-between hover:border-border-strong transition-all duration-300 relative group"
                >
                  <div className="space-y-4">
                    {/* Header Row: Match Ring + Title + Bookmark */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <MatchRing pct={role.matchScore} />
                        <div>
                          <h3 className="font-display text-lg font-bold text-text-main group-hover:text-accent transition-colors">
                            {role.roleTitle}
                          </h3>
                          <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                            <Briefcase size={12} />
                            <span>{role.industry || 'Tech & Enterprise'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          bookmarkMutation.mutate({
                            roleTitle: role.roleTitle,
                            industry: role.industry,
                            matchScore: role.matchScore,
                            matchReason: role.matchReason,
                          })
                        }
                        className={`p-2 rounded-xl border transition-all ${
                          bookmarked
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-elevated/40 border-border text-text-muted hover:text-text-main'
                        }`}
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark this career path'}
                      >
                        {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>

                    {/* Meta stats badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {role.salaryRange && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-elevated border border-border-strong text-text-secondary">
                          <DollarSign size={12} className="text-accent" />
                          <span>{role.salaryRange}</span>
                        </span>
                      )}
                      {role.demandOutlook && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                          <TrendingUp size={12} />
                          <span>{role.demandOutlook}</span>
                        </span>
                      )}
                    </div>

                    {/* Match reason description */}
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {role.matchReason || role.description}
                    </p>

                    {/* Quick Skills Snapshot */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>Demonstrated in your coursework</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(role.topSkillsYouHave || []).map((sk) => (
                          <span
                            key={sk}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <Sparkles size={12} className="text-accent" />
                        <span>Key Skills to Acquire Next</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(role.skillsToAcquire || []).map((sk) => (
                          <span
                            key={sk}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Section: Full Roadmap & Certifications */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 border-t border-border space-y-4 overflow-hidden"
                        >
                          {/* Recommended Certs / Courses */}
                          {role.recommendedCourses?.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                <Award size={13} className="text-accent" />
                                <span>Recommended Credentials & Courses</span>
                              </h4>
                              <ul className="space-y-1 text-xs text-text-secondary">
                                {role.recommendedCourses.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-accent">•</span>
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Portfolio Projects */}
                          {role.portfolioProjects?.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                <Layers size={13} className="text-accent" />
                                <span>High-Impact Portfolio Projects</span>
                              </h4>
                              <ul className="space-y-1 text-xs text-text-secondary">
                                {role.portfolioProjects.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-accent">•</span>
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 4-Stage Roadmap Timeline */}
                          {role.milestoneRoadmap?.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <h4 className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                <Clock size={13} className="text-accent" />
                                <span>Step-by-Step Transition Roadmap</span>
                              </h4>
                              <div className="space-y-2.5 pl-2 border-l border-border-strong ml-1">
                                {role.milestoneRoadmap.map((step, sIdx) => (
                                  <div key={sIdx} className="relative pl-3 space-y-0.5">
                                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-accent" />
                                    <div className="text-[11px] font-bold text-accent">{step.stage}</div>
                                    <div className="text-xs font-semibold text-text-main">{step.title}</div>
                                    <ul className="text-[11px] text-text-muted list-disc list-inside space-y-0.5 mt-0.5">
                                      {step.actions?.map((act, aIdx) => (
                                        <li key={aIdx}>{act}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-border">
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : idx)}
                      className="text-xs font-medium text-text-secondary hover:text-text-main flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Collapse Roadmap' : 'Explore Detailed Roadmap'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      onClick={() => handleDeepDive(role.roleTitle)}
                      disabled={gapMutation.isPending}
                      className="px-3.5 py-1.5 rounded-xl bg-elevated hover:bg-elevated/80 border border-border-strong hover:border-accent text-accent text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <span>Deep Dive Skill Gap</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab Content: Skill Gap Analysis ── */}
      {activeTab === 'gap' && (
        <div className="space-y-6">
          {/* Target Role Selector & Input */}
          <div className="rounded-2xl bg-card border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-text-main">
                Target Role Skill Gap Evaluation
              </h3>
              <p className="text-xs text-text-muted">
                Benchmark your current subjects and transcripts against real-world job requirements.
              </p>
            </div>

            <div className="flex items-center gap-2 max-w-md w-full">
              <input
                type="text"
                placeholder="e.g. AI Research Engineer, Product Manager"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-elevated border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => {
                  if (customRoleInput.trim()) {
                    handleDeepDive(customRoleInput.trim())
                  }
                }}
                disabled={gapMutation.isPending || !customRoleInput.trim()}
                className="px-4 py-2 rounded-xl bg-accent text-bg hover:bg-accent-soft text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
              >
                {gapMutation.isPending ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {skillGapAnalysis?.targetRole ? (
            <motion.div {...fade} className="space-y-6">
              {/* Readiness Overview Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-card to-elevated border border-border p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Target size={14} />
                    <span>Role Readiness Breakdown</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-text-main">
                    {skillGapAnalysis.targetRole}
                  </h2>
                  <p className="text-sm text-text-secondary max-w-2xl">
                    {skillGapAnalysis.roleOverview}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-card/70 border border-border-strong p-4 rounded-2xl shrink-0">
                  <MatchRing pct={skillGapAnalysis.overallReadiness || 75} size={64} stroke={6} />
                  <div>
                    <div className="text-xs text-text-muted font-medium">Market Readiness</div>
                    <div className="text-lg font-bold text-text-main font-mono">
                      {skillGapAnalysis.overallReadiness || 75}% Ready
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Columns: What You Have vs What You Need to Bridge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 size={18} />
                    <span>Skills Validated by Coursework ({skillGapAnalysis.matchedSkills?.length || 0})</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Competencies actively covered in your enrolled university syllabus and assessments.
                  </p>
                  <div className="space-y-2 pt-2">
                    {skillGapAnalysis.matchedSkills?.map((sk, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2.5 text-xs text-text-main"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-medium">{sk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Skills & Bridging Plan */}
                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                    <Sparkles size={18} />
                    <span>Target Skills to Bridge ({skillGapAnalysis.missingSkills?.length || 0})</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Strategic competencies required by hiring managers, with estimated ramp-up times.
                  </p>
                  <div className="space-y-3 pt-2">
                    {skillGapAnalysis.missingSkills?.map((item, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-elevated/50 border border-border space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-text-main">{item.skill}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                              {item.importance || 'Crucial'}
                            </span>
                            {item.estimatedTimeToLearn && (
                              <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                                <Clock size={10} />
                                {item.estimatedTimeToLearn}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {item.howToBridge}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coursework Alignment Table */}
              {skillGapAnalysis.courseworkAlignment?.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2 text-text-main font-semibold text-sm">
                    <BookOpen size={18} className="text-accent" />
                    <span>How Your Current Courses Align With {skillGapAnalysis.targetRole}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {skillGapAnalysis.courseworkAlignment.map((cw, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-elevated/40 border border-border-strong space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main">{cw.subjectName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent font-medium">
                            {cw.relevance}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {cw.suggestedFocus}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action Steps */}
              {skillGapAnalysis.recommendedActionSteps?.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2 text-text-main font-semibold text-sm">
                    <Award size={18} className="text-accent" />
                    <span>High-Priority Action Checklist</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {skillGapAnalysis.recommendedActionSteps.map((step, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-elevated/60 border border-border flex items-start gap-3"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent font-mono text-[11px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-text-secondary leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-elevated border border-border-strong text-accent flex items-center justify-center mx-auto">
                <Target size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-text-main">No Role Evaluated Yet</h3>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Select any career path above or type your target job role in the search bar to generate an in-depth skill gap analysis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Saved Roles ── */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {bookmarkedRoles.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-elevated border border-border-strong text-text-muted flex items-center justify-center mx-auto">
                <Bookmark size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-text-main">No Saved Roles Yet</h3>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Click the bookmark icon on any recommended career card to save it here for future planning and tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedRoles.map((bm, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border p-6 flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display text-base font-bold text-text-main">
                          {bm.roleTitle}
                        </h4>
                        <p className="text-xs text-text-muted">{bm.industry || 'Tech'}</p>
                      </div>
                      <button
                        onClick={() =>
                          bookmarkMutation.mutate({
                            roleTitle: bm.roleTitle,
                          })
                        }
                        className="text-accent hover:text-accent-soft p-1 transition-colors"
                        title="Remove bookmark"
                      >
                        <BookmarkCheck size={20} />
                      </button>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {bm.matchReason || 'Saved to your target career wishlist.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-mono">
                      {bm.matchScore ? `${bm.matchScore}% Match` : 'Saved'}
                    </span>
                    <button
                      onClick={() => handleDeepDive(bm.roleTitle)}
                      disabled={gapMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-elevated/80 border border-border-strong text-accent text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>Analyze Gaps</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Aspirations Config Modal / Drawer ── */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl bg-card border border-border p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sliders size={20} className="text-accent" />
                  <h3 className="font-display text-xl font-bold text-text-main">
                    Personalize Career Aspirations
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-main transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main">
                    Dream Job Title or Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Machine Learning Engineer, Cloud Architect"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Target Industry</label>
                    <select
                      value={formData.targetIndustry}
                      onChange={(e) => setFormData({ ...formData, targetIndustry: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-xs text-text-main focus:outline-none focus:border-accent"
                    >
                      <option value="Technology & Software">Technology & Software</option>
                      <option value="Artificial Intelligence & Data Tech">AI & Data Tech</option>
                      <option value="Finance & FinTech">Finance & FinTech</option>
                      <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                      <option value="Consulting & Strategy">Consulting & Strategy</option>
                      <option value="Engineering & Robotics">Engineering & Robotics</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-main">Work Style</label>
                    <select
                      value={formData.workStyle}
                      onChange={(e) => setFormData({ ...formData, workStyle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-xs text-text-main focus:outline-none focus:border-accent"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main">Experience Goal</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-xs text-text-main focus:outline-none focus:border-accent"
                  >
                    <option value="Entry-Level / Graduate">Entry-Level / Graduate</option>
                    <option value="Internship">Summer / Fall Internship</option>
                    <option value="Junior Specialist">Junior Specialist (1-2 Years)</option>
                    <option value="Research / Higher Studies">Research / Higher Studies (Master&apos;s / PhD)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main">
                    Custom Interests & Tech Stack (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PyTorch, React, WebSockets, Cybersecurity, Microservices"
                    value={formData.customInterests}
                    onChange={(e) => setFormData({ ...formData, customInterests: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-main transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regenMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-accent text-bg hover:bg-accent-soft text-xs font-semibold transition-all shadow-glow-sm disabled:opacity-50"
                  >
                    {regenMutation.isPending ? 'Generating Roadmaps...' : 'Save & Re-generate Roadmaps'}
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
