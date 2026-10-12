/**
 * profile.controller.js — GET and PUT /api/profile.
 * Always scoped to req.user.id; never accepts userId from client.
 */
import { z } from 'zod'
import StudentProfile from '../models/StudentProfile.js'
import { ok } from '../utils/response.js'
import { notFound } from '../utils/ApiError.js'

// ── Zod update schema (all fields optional for partial updates) ──────────────
export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  course: z.string().trim().max(120).optional(),
  semester: z.number().int().min(1).max(20).nullable().optional(),
  institution: z.string().trim().max(200).optional(),
  goals: z.array(z.string().trim().max(200)).max(10).optional(),
  learningPreferences: z.enum(['visual', 'reading', 'practice', 'mixed']).optional(),
  weeklyStudyHours: z.number().min(0).max(168).optional(),
  timezone: z.string().max(60).optional(),
  careerInterests: z.array(z.string().trim().max(100)).max(20).optional(),
  onboardingComplete: z.boolean().optional(),
  avatarUrl: z.string().max(2000000).optional(), // base64 data URL or external URL
})

/** GET /api/profile */
export async function getProfile(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id })
    if (!profile) throw notFound('Profile not found')
    ok(res, profile)
  } catch (err) {
    next(err)
  }
}

/** PUT /api/profile */
export async function updateProfile(req, res, next) {
  try {
    const updates = req.body // already validated by Zod middleware

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    )
    if (!profile) throw notFound('Profile not found')

    ok(res, profile)
  } catch (err) {
    next(err)
  }
}
