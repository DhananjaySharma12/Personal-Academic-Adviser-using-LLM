/**
 * admin.controller.js — Admin platform telemetry, stats, and user management.
 */
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import Quiz from '../models/Quiz.js'
import Document from '../models/Document.js'
import StudyPlan from '../models/StudyPlan.js'
import Reminder from '../models/Reminder.js'
import { env } from '../config/env.js'
import { ok } from '../utils/response.js'
import { notFound, badRequest } from '../utils/ApiError.js'

export async function getAdminStats(_req, res, next) {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalSubjects,
      totalRecords,
      totalQuizzes,
      totalDocuments,
      totalStudyPlans,
      totalReminders,
    ] = await Promise.all([
      User.countDocuments(),
      StudentProfile.countDocuments(),
      Subject.countDocuments(),
      AcademicRecord.countDocuments(),
      Quiz.countDocuments(),
      Document.countDocuments(),
      StudyPlan.countDocuments(),
      Reminder.countDocuments(),
    ])

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('email role createdAt')

    ok(res, {
      telemetry: {
        totalUsers,
        totalProfiles,
        totalSubjects,
        totalRecords,
        totalQuizzes,
        totalDocuments,
        totalStudyPlans,
        totalReminders,
      },
      system: {
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL,
        embeddingModel: env.EMBEDDING_MODEL,
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      recentUsers,
    })
  } catch (err) {
    next(err)
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('_id email role createdAt')

    // Attach profile information and subject counts
    const enriched = await Promise.all(
      users.map(async (u) => {
        const [profile, subjectCount] = await Promise.all([
          StudentProfile.findOne({ userId: u._id }).select('displayName course institution'),
          Subject.countDocuments({ userId: u._id }),
        ])
        return {
          id: u._id,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          displayName: profile?.displayName || '—',
          course: profile?.course || '—',
          institution: profile?.institution || '—',
          subjectCount,
        }
      })
    )

    ok(res, { users: enriched })
  } catch (err) {
    next(err)
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['student', 'admin'].includes(role)) {
      throw badRequest('Role must be either student or admin')
    }

    const user = await User.findById(id)
    if (!user) throw notFound('User not found')

    user.role = role
    await user.save()

    ok(res, { message: `User role updated to ${role}`, user: { id: user._id, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
}
