/**
 * OnboardingPage — 3-step wizard to complete student profile.
 * Step 1: Personal info (name, course, semester, institution)
 * Step 2: Study preferences (weekly hours, learning style, goals)
 * Step 3: Career interests + confirmation
 * On complete → PUT /api/profile → navigate to dashboard
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { profileApi } from '@/api/profile'

const STEPS = [
  { id: 1, label: 'About You', icon: GraduationCap },
  { id: 2, label: 'Study Style', icon: BookOpen },
  { id: 3, label: 'Career Goals', icon: Briefcase },
]

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0, transition: { duration: 0.18 } }),
}

export default function OnboardingPage() {
  const { user, profile, setProfile, refreshProfile, onboardingComplete } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (onboardingComplete) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [onboardingComplete, navigate])

  const [formData, setFormData] = useState({
    displayName: profile?.displayName || user?.displayName || '',
    course: profile?.course || '',
    semester: profile?.semester || '',
    institution: profile?.institution || '',
    weeklyStudyHours: profile?.weeklyStudyHours || 20,
    learningPreferences: profile?.learningPreferences || 'mixed',
    goals: (profile?.goals || []).join(', '),
    careerInterests: (profile?.careerInterests || []).join(', '),
  })

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        displayName: prev.displayName || profile.displayName || '',
        course: prev.course || profile.course || '',
        semester: prev.semester || profile.semester || '',
        institution: prev.institution || profile.institution || '',
      }))
    }
  }, [profile])

  const validateStep = (currentStep) => {
    const errs = {}
    if (currentStep === 1) {
      if (!formData.displayName.trim() || formData.displayName.trim().length < 2) {
        errs.displayName = 'Name must be at least 2 characters'
      }
      if (!formData.course.trim()) {
        errs.course = 'Course is required'
      }
      const sem = Number(formData.semester)
      if (!formData.semester || isNaN(sem) || sem < 1 || sem > 20) {
        errs.semester = 'Enter a valid semester (1-20)'
      }
    } else if (currentStep === 2) {
      const hours = Number(formData.weeklyStudyHours)
      if (isNaN(hours) || hours < 1 || hours > 100) {
        errs.weeklyStudyHours = 'Enter study hours between 1 and 100'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const goNext = (e) => {
    e.preventDefault()
    if (!validateStep(step)) return

    if (step < 3) {
      setDir(1)
      setStep((s) => s + 1)
    } else {
      submitAll()
    }
  }

  const goBack = () => {
    setDir(-1)
    setStep((s) => s - 1)
    setErrors({})
  }

  const submitAll = async () => {
    setSubmitting(true)
    setServerError('')
    try {
      const payload = {
        displayName: formData.displayName.trim(),
        course: formData.course.trim(),
        semester: Number(formData.semester),
        institution: formData.institution.trim(),
        weeklyStudyHours: Number(formData.weeklyStudyHours) || 20,
        learningPreferences: formData.learningPreferences || 'mixed',
        goals: formData.goals
          ? formData.goals.split(',').map((g) => g.trim()).filter(Boolean)
          : [],
        careerInterests: formData.careerInterests
          ? formData.careerInterests.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        onboardingComplete: true,
      }
      const updated = await profileApi.update(payload)
      setProfile(updated)
      await refreshProfile()
      window.location.href = '/app/dashboard'
    } catch (err) {
      setServerError(err.message || 'Failed to complete setup. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(65,45,21,0.45) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-lg z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <GraduationCap size={22} className="text-primary-soft" />
            <span className="font-display text-base font-semibold text-text-main">
              Personal Academic Adviser
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-text-main mb-2">
            Let&apos;s set up your profile
          </h1>
          <p className="text-text-secondary text-sm">
            This helps your AI adviser give you personalised advice
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step > s.id
                      ? 'bg-primary border-primary'
                      : step === s.id
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  {step > s.id ? (
                    <CheckCircle2 size={18} className="text-white" />
                  ) : (
                    <s.icon
                      size={16}
                      className={step === s.id ? 'text-primary-soft' : 'text-text-muted'}
                    />
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    step === s.id ? 'text-primary-soft' : 'text-text-muted'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-16 mx-2 mt-[-14px] transition-all duration-300 ${
                    step > s.id ? 'bg-primary/60' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <form onSubmit={goNext} className="space-y-4" noValidate>
                {step === 1 && (
                  <Step1 formData={formData} onChange={handleChange} errors={errors} />
                )}
                {step === 2 && (
                  <Step2 formData={formData} onChange={handleChange} errors={errors} />
                )}
                {step === 3 && (
                  <Step3 formData={formData} onChange={handleChange} errors={errors} />
                )}

                {serverError && (
                  <div className="rounded-input bg-danger/10 border border-danger/30 px-3 py-2 text-danger text-sm">
                    {serverError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="btn-ghost flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main transition-colors"
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {step < 3 ? (
                      <>
                        Next <ChevronRight size={16} />
                      </>
                    ) : submitting ? (
                      'Saving…'
                    ) : (
                      'Complete setup'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Step sub-components ───────────────────────────────────────────────────────

function Step1({ formData, onChange, errors }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main mb-1">Tell us about yourself</h2>
      <Field label="Full name" id="ob-name" error={errors.displayName}>
        <input
          id="ob-name"
          name="displayName"
          type="text"
          placeholder="Rahul Sharma"
          className="input w-full"
          value={formData.displayName}
          onChange={onChange}
        />
      </Field>
      <Field label="Course / Programme" id="ob-course" error={errors.course}>
        <input
          id="ob-course"
          name="course"
          type="text"
          placeholder="e.g. B.Tech Computer Science"
          className="input w-full"
          value={formData.course}
          onChange={onChange}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current semester" id="ob-sem" error={errors.semester}>
          <input
            id="ob-sem"
            name="semester"
            type="number"
            min={1}
            max={20}
            placeholder="e.g. 3"
            className="input w-full"
            value={formData.semester}
            onChange={onChange}
          />
        </Field>
        <Field label="Institution (optional)" id="ob-inst" error={errors.institution}>
          <input
            id="ob-inst"
            name="institution"
            type="text"
            placeholder="College / University"
            className="input w-full"
            value={formData.institution}
            onChange={onChange}
          />
        </Field>
      </div>
    </div>
  )
}

function Step2({ formData, onChange, errors }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main mb-1">How do you study?</h2>
      <Field
        label="Weekly study hours available"
        id="ob-hours"
        error={errors.weeklyStudyHours}
      >
        <input
          id="ob-hours"
          name="weeklyStudyHours"
          type="number"
          min={1}
          max={100}
          placeholder="e.g. 20"
          className="input w-full"
          value={formData.weeklyStudyHours}
          onChange={onChange}
        />
      </Field>
      <Field
        label="Learning preference"
        id="ob-learn"
        error={errors.learningPreferences}
      >
        <select
          id="ob-learn"
          name="learningPreferences"
          className="input w-full"
          value={formData.learningPreferences}
          onChange={onChange}
        >
          <option value="mixed">Mixed (all styles)</option>
          <option value="visual">Visual (diagrams, videos)</option>
          <option value="reading">Reading (notes, textbooks)</option>
          <option value="practice">Practice (problems, quizzes)</option>
        </select>
      </Field>
      <Field
        label="Academic goals (comma-separated)"
        id="ob-goals"
        error={errors.goals}
        hint="e.g. Score 90% in finals, Clear GATE"
      >
        <textarea
          id="ob-goals"
          name="goals"
          rows={3}
          placeholder="Score 90% in finals, Clear GATE exam"
          className="input w-full resize-none"
          value={formData.goals}
          onChange={onChange}
        />
      </Field>
    </div>
  )
}

function Step3({ formData, onChange, errors }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-main mb-1">Career interests</h2>
      <p className="text-text-secondary text-sm">
        This helps us give career-relevant advice. You can change this anytime.
      </p>
      <Field
        label="Career interests (comma-separated)"
        id="ob-career"
        error={errors.careerInterests}
        hint="e.g. Software Engineering, Data Science, Research"
      >
        <textarea
          id="ob-career"
          name="careerInterests"
          rows={3}
          placeholder="Software Engineering, Data Science, Research"
          className="input w-full resize-none"
          value={formData.careerInterests}
          onChange={onChange}
        />
      </Field>
      <div className="rounded-card bg-primary/5 border border-primary/20 p-4">
        <p className="text-primary-soft text-sm font-medium mb-1">
          🎓 You&apos;re almost done!
        </p>
        <p className="text-text-secondary text-xs">
          After setup, your AI adviser will use this info to give you personalised study plans, quizzes, and career guidance.
        </p>
      </div>
    </div>
  )
}

function Field({ label, id, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text-main">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-text-muted text-xs">{hint}</p>}
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  )
}
