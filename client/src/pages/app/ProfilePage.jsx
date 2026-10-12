/**
 * ProfilePage — View, edit student profile, and upload profile picture (DP).
 */
import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User,
  BookOpen,
  Clock,
  Briefcase,
  Save,
  Loader2,
  Camera,
  Edit3,
  Globe,
  Target,
  GraduationCap,
  Sparkles,
  Check,
} from 'lucide-react'
import { profileApi } from '@/api/profile'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  course: z.string().trim().max(120).optional(),
  semester: z.coerce.number().int().min(1).max(20).nullable().optional(),
  institution: z.string().trim().max(200).optional(),
  weeklyStudyHours: z.coerce.number().min(0).max(168).optional(),
  learningPreferences: z.enum(['visual', 'reading', 'practice', 'mixed']).optional(),
  goals: z.string().trim().max(1000).optional(),
  careerInterests: z.string().trim().max(500).optional(),
  timezone: z.string().max(60).optional(),
})

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    values: profile
      ? {
          displayName: profile.displayName ?? '',
          course: profile.course ?? '',
          semester: profile.semester ?? '',
          institution: profile.institution ?? '',
          weeklyStudyHours: profile.weeklyStudyHours ?? 20,
          learningPreferences: profile.learningPreferences ?? 'mixed',
          goals: (profile.goals ?? []).join(', '),
          careerInterests: (profile.careerInterests ?? []).join(', '),
          timezone: profile.timezone ?? 'Asia/Kolkata',
        }
      : {},
  })

  const mutation = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      addToast('Profile updated successfully!', 'success')
    },
    onError: (err) => {
      addToast(err.message || 'Failed to update profile', 'error')
    },
  })

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      semester: data.semester ? Number(data.semester) : null,
      weeklyStudyHours: Number(data.weeklyStudyHours),
      goals: data.goals ? data.goals.split(',').map((g) => g.trim()).filter(Boolean) : [],
      careerInterests: data.careerInterests
        ? data.careerInterests.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
    })
  }

  // ── Avatar upload with client-side canvas compression ──────────────────────
  const handleAvatarChange = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        addToast('Please select a valid image file', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('Image must be less than 10MB', 'error')
        return
      }

      setIsUploadingAvatar(true)
      const reader = new FileReader()
      reader.onload = (evt) => {
        const img = new Image()
        img.onload = async () => {
          try {
            // Resize & center-crop square to 256x256
            const canvas = document.createElement('canvas')
            const size = 256
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            const minDim = Math.min(img.width, img.height)
            const sx = (img.width - minDim) / 2
            const sy = (img.height - minDim) / 2
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
            setAvatarPreview(optimizedDataUrl)

            await profileApi.uploadAvatar(optimizedDataUrl)
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            refreshProfile()
            addToast('Profile picture updated!', 'success')
          } catch {
            addToast('Failed to save profile picture', 'error')
            setAvatarPreview(null)
          } finally {
            setIsUploadingAvatar(false)
          }
        }
        img.onerror = () => {
          setIsUploadingAvatar(false)
          addToast('Could not load image file', 'error')
        }
        img.src = evt.target.result
      }
      reader.readAsDataURL(file)
    },
    [addToast, queryClient, refreshProfile]
  )

  const handleRemoveAvatar = useCallback(async () => {
    setIsUploadingAvatar(true)
    try {
      await profileApi.uploadAvatar('')
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      refreshProfile()
      addToast('Profile picture removed', 'success')
    } catch {
      addToast('Failed to remove profile picture', 'error')
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [addToast, queryClient, refreshProfile])

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Student'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const currentAvatar = avatarPreview || profile?.avatarUrl || null

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="skeleton h-40 rounded-card" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* ── Hero Profile Card ─────────────────────────────────────────── */}
      <div
        className="card relative overflow-hidden rounded-card"
        style={{
          background: 'linear-gradient(145deg, #84A282 0%, #6B8F69 60%, #5E7A5C 100%)',
          borderColor: 'rgba(184, 207, 179, 0.40)',
          boxShadow: '0 4px 24px rgba(132, 162, 130, 0.30), 0 0 40px rgba(132, 162, 130, 0.12)',
        }}
      >
        {/* Soft glow background */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #FEFAF3, transparent)' }}
        />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full blur-2xl opacity-20"
          style={{ background: 'radial-gradient(circle, #F6E2E9, transparent)' }}
        />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 cursor-pointer group"
              style={{ borderColor: 'rgba(254, 250, 243, 0.60)', boxShadow: '0 0 16px rgba(254, 250, 243, 0.25)' }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'rgba(254, 250, 243, 0.25)', color: '#FEFAF3' }}
                >
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(45, 58, 44, 0.70)' }}
              >
                {isUploadingAvatar ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={18} className="text-white" />
                    <span className="text-[10px] mt-1 font-medium text-white">Change</span>
                  </>
                )}
              </div>
            </div>

            {/* Camera badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: '#FEFAF3', borderColor: '#84A282' }}
              title="Upload photo"
            >
              <Camera size={13} style={{ color: '#5E7A5C' }} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {currentAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="mt-2 text-[11px] text-danger hover:underline font-medium block text-center w-full transition-opacity hover:opacity-80"
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Name & info */}
          <div className="text-center sm:text-left flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(254, 250, 243, 0.85)' }}>
                Student Profile
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#FEFAF3' }}>
              {displayName}
            </h1>
            {profile?.course && (
              <p className="text-sm" style={{ color: 'rgba(254, 250, 243, 0.85)' }}>
                {profile.course}
                {profile.semester ? ` • Semester ${profile.semester}` : ''}
                {profile.institution ? ` • ${profile.institution}` : ''}
              </p>
            )}
            <p className="text-xs" style={{ color: 'rgba(254, 250, 243, 0.70)' }}>
              {user?.email}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
              {[
                { icon: Clock, label: `${profile?.weeklyStudyHours || 20}h/week` },
                { icon: GraduationCap, label: profile?.learningPreferences || 'Mixed learner' },
                { icon: Target, label: profile?.goals?.length ? `${profile.goals.length} goals` : 'No goals set' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(254, 250, 243, 0.20)', color: '#FEFAF3', border: '1px solid rgba(254, 250, 243, 0.35)' }}
                >
                  <Icon size={12} style={{ color: '#FEFAF3' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* Personal Info */}
        <ProfileSection icon={User} title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" id="p-name" error={errors.displayName?.message} required>
              <input id="p-name" type="text" className="input w-full" {...register('displayName')} />
            </Field>
            <Field label="Institution / University" id="p-inst" error={errors.institution?.message}>
              <input id="p-inst" type="text" className="input w-full" placeholder="e.g. Parul University" {...register('institution')} />
            </Field>
            <Field label="Degree / Course" id="p-course" error={errors.course?.message}>
              <input id="p-course" type="text" className="input w-full" placeholder="e.g. B.Tech Computer Science" {...register('course')} />
            </Field>
            <Field label="Current Semester" id="p-sem" error={errors.semester?.message}>
              <input id="p-sem" type="number" min={1} max={20} className="input w-full" placeholder="e.g. 4" {...register('semester')} />
            </Field>
          </div>
        </ProfileSection>

        {/* Study Preferences */}
        <ProfileSection icon={BookOpen} title="Study Preferences">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Weekly Study Hours" id="p-hours" error={errors.weeklyStudyHours?.message}>
              <input id="p-hours" type="number" min={0} max={168} className="input w-full" placeholder="e.g. 20" {...register('weeklyStudyHours')} />
            </Field>
            <Field label="Learning Style" id="p-learn" error={errors.learningPreferences?.message}>
              <select id="p-learn" className="input w-full cursor-pointer" {...register('learningPreferences')}>
                <option value="mixed">🔀 Mixed</option>
                <option value="visual">👁️ Visual</option>
                <option value="reading">📖 Reading & Notes</option>
                <option value="practice">✍️ Practice Problems</option>
              </select>
            </Field>
          </div>
          <Field label="Academic Goals (comma-separated)" id="p-goals" error={errors.goals?.message}>
            <textarea
              id="p-goals"
              rows={2}
              className="input w-full resize-none"
              placeholder="e.g. Score 85%+ GPA, Clear semester exams, Build strong DSA foundation"
              {...register('goals')}
            />
          </Field>
        </ProfileSection>

        {/* Career */}
        <ProfileSection icon={Briefcase} title="Career Interests">
          <Field label="Career Interests (comma-separated)" id="p-career" error={errors.careerInterests?.message}>
            <textarea
              id="p-career"
              rows={2}
              className="input w-full resize-none"
              placeholder="e.g. Software Engineering, Machine Learning, Data Science"
              {...register('careerInterests')}
            />
          </Field>
        </ProfileSection>

        {/* Timezone */}
        <ProfileSection icon={Globe} title="Timezone">
          <Field label="Your Timezone" id="p-tz" error={errors.timezone?.message}>
            <input id="p-tz" type="text" className="input w-full" placeholder="Asia/Kolkata" {...register('timezone')} />
          </Field>
        </ProfileSection>

        {/* Save Bar */}
        <div className="card p-4 flex items-center justify-between gap-4"
          style={{ borderColor: 'rgba(132, 162, 130, 0.25)', background: '#FFFFFF' }}
        >
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || mutation.isPending}
            className="btn-ghost text-sm text-text-muted disabled:opacity-30"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-btn text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isDirty ? '#84A282' : 'rgba(132, 162, 130, 0.35)',
              color: '#FEFAF3',
              border: '1px solid #84A282',
              boxShadow: isDirty ? '0 0 18px rgba(132, 162, 130, 0.35)' : 'none',
            }}
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} style={{ color: '#FEFAF3' }} />
            ) : (
              <Save size={16} />
            )}
            {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ProfileSection({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 space-y-4" style={{ borderColor: 'rgba(132, 162, 130, 0.22)', background: '#FFFFFF' }}>
      <div className="flex items-center gap-2.5 border-b pb-3" style={{ borderColor: 'rgba(132, 162, 130, 0.15)' }}>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(132, 162, 130, 0.15)', border: '1px solid rgba(132, 162, 130, 0.25)' }}
        >
          <Icon size={14} style={{ color: '#84A282' }} />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#2D3A2C' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, id, error, children, required }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium" style={{ color: '#4A5E49' }}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#C0645A' }}>{error}</p>}
    </div>
  )
}
