/**
 * career.controller.js — Career Guidance and Roadmaps Controller.
 * Provides personalized AI career recommendations, roadmaps, bookmarking,
 * and deep skill-gap evaluation grounded in the student's academic background.
 */
import CareerPlan from '../models/CareerPlan.js'
import StudentProfile from '../models/StudentProfile.js'
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import QuizAttempt from '../models/QuizAttempt.js'
import {
  generateCareerGuidanceWithAi,
  analyzeSkillGapWithAi,
} from '../services/ai/gemini.service.js'
import { sendSuccess } from '../utils/response.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Helper to fetch student context (profile, subjects, records, quiz attempts).
 */
async function getStudentContext(userId) {
  const [profile, subjects, academicRecords, quizAttempts] = await Promise.all([
    StudentProfile.findOne({ userId }),
    Subject.find({ userId }),
    AcademicRecord.find({ userId }),
    QuizAttempt.find({ userId }),
  ])

  return {
    studentProfile: profile || {},
    subjects: subjects || [],
    academicRecords: academicRecords || [],
    quizAttempts: quizAttempts || [],
  }
}

/**
 * GET /api/career
 * Fetch user's career plan. If no recommendations exist yet, automatically generates them.
 */
export async function getCareerGuidance(req, res, next) {
  try {
    const userId = req.user.id
    let careerPlan = await CareerPlan.findOne({ userId })

    const context = await getStudentContext(userId)

    if (!careerPlan || !careerPlan.recommendations || careerPlan.recommendations.length === 0) {
      // Auto-generate on first visit
      const generated = await generateCareerGuidanceWithAi({
        studentProfile: context.studentProfile,
        subjects: context.subjects,
        academicRecords: context.academicRecords,
        quizAttempts: context.quizAttempts,
        preferences: careerPlan || {
          targetIndustry: 'Technology & Software',
          workStyle: 'Hybrid',
          experienceLevel: 'Entry-Level / Graduate',
        },
      })

      if (!careerPlan) {
        careerPlan = new CareerPlan({
          userId,
          careerVision: generated.careerVision,
          recommendations: generated.recommendedRoles,
          targetIndustry: 'Technology & Software',
        })
      } else {
        careerPlan.careerVision = generated.careerVision
        careerPlan.recommendations = generated.recommendedRoles
      }

      await careerPlan.save()
    }

    sendSuccess(res, 200, {
      careerPlan,
      studentProfile: {
        displayName: context.studentProfile.displayName,
        course: context.studentProfile.course,
        semester: context.studentProfile.semester,
        institution: context.studentProfile.institution,
        careerInterests: context.studentProfile.careerInterests || [],
      },
      academicSummary: {
        totalSubjects: context.subjects.length,
        subjects: context.subjects.map((s) => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          syllabusProgress: s.syllabusProgress || 0,
        })),
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/career/recommendations
 * Refresh or regenerate recommendations with updated aspirations/parameters.
 */
export async function generateRecommendations(req, res, next) {
  try {
    const userId = req.user.id
    const {
      targetRole,
      targetIndustry,
      experienceLevel,
      workStyle,
      customInterests,
    } = req.body

    const context = await getStudentContext(userId)

    let careerPlan = await CareerPlan.findOne({ userId })
    if (!careerPlan) {
      careerPlan = new CareerPlan({ userId })
    }

    if (targetRole !== undefined) careerPlan.targetRole = targetRole
    if (targetIndustry !== undefined) careerPlan.targetIndustry = targetIndustry
    if (experienceLevel !== undefined) careerPlan.experienceLevel = experienceLevel
    if (workStyle !== undefined) careerPlan.workStyle = workStyle
    if (Array.isArray(customInterests)) careerPlan.customInterests = customInterests

    const generated = await generateCareerGuidanceWithAi({
      studentProfile: context.studentProfile,
      subjects: context.subjects,
      academicRecords: context.academicRecords,
      quizAttempts: context.quizAttempts,
      preferences: {
        targetRole: careerPlan.targetRole,
        targetIndustry: careerPlan.targetIndustry,
        experienceLevel: careerPlan.experienceLevel,
        workStyle: careerPlan.workStyle,
        customInterests: careerPlan.customInterests,
      },
    })

    careerPlan.careerVision = generated.careerVision
    careerPlan.recommendations = generated.recommendedRoles
    await careerPlan.save()

    sendSuccess(res, 200, {
      careerPlan,
      message: 'Career guidance recommendations updated successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/career/preferences
 * Update career preferences without triggering a full LLM re-run.
 */
export async function updateCareerPreferences(req, res, next) {
  try {
    const userId = req.user.id
    const {
      careerVision,
      targetRole,
      targetIndustry,
      experienceLevel,
      workStyle,
      customInterests,
    } = req.body

    let careerPlan = await CareerPlan.findOne({ userId })
    if (!careerPlan) {
      careerPlan = new CareerPlan({ userId })
    }

    if (careerVision !== undefined) careerPlan.careerVision = careerVision
    if (targetRole !== undefined) careerPlan.targetRole = targetRole
    if (targetIndustry !== undefined) careerPlan.targetIndustry = targetIndustry
    if (experienceLevel !== undefined) careerPlan.experienceLevel = experienceLevel
    if (workStyle !== undefined) careerPlan.workStyle = workStyle
    if (Array.isArray(customInterests)) careerPlan.customInterests = customInterests

    await careerPlan.save()

    sendSuccess(res, 200, {
      careerPlan,
      message: 'Preferences saved successfully',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/career/bookmark
 * Toggle bookmark status for a role recommendation.
 */
export async function toggleBookmark(req, res, next) {
  try {
    const userId = req.user.id
    const { roleTitle, industry, matchScore, matchReason } = req.body

    if (!roleTitle) {
      throw new ApiError(400, 'roleTitle is required to bookmark')
    }

    let careerPlan = await CareerPlan.findOne({ userId })
    if (!careerPlan) {
      careerPlan = new CareerPlan({ userId })
    }

    const existingIndex = careerPlan.bookmarkedRoles.findIndex(
      (b) => b.roleTitle.toLowerCase() === roleTitle.toLowerCase()
    )

    let isBookmarked = false
    if (existingIndex > -1) {
      careerPlan.bookmarkedRoles.splice(existingIndex, 1)
      isBookmarked = false
    } else {
      careerPlan.bookmarkedRoles.push({
        roleTitle,
        industry: industry || '',
        matchScore: matchScore || 85,
        matchReason: matchReason || '',
        savedAt: new Date(),
      })
      isBookmarked = true
    }

    await careerPlan.save()

    sendSuccess(res, 200, {
      bookmarkedRoles: careerPlan.bookmarkedRoles,
      isBookmarked,
      message: isBookmarked ? 'Role bookmarked' : 'Role removed from bookmarks',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/career/skill-gap
 * Evaluate deep skill gaps and preparation actions for a specific career target.
 */
export async function getSkillGapAnalysis(req, res, next) {
  try {
    const userId = req.user.id
    const { targetRole } = req.body

    const context = await getStudentContext(userId)

    let careerPlan = await CareerPlan.findOne({ userId })
    if (!careerPlan) {
      careerPlan = new CareerPlan({ userId })
    }

    const roleToAnalyze = targetRole || careerPlan.targetRole || 'Full-Stack Software Engineer'

    const analysis = await analyzeSkillGapWithAi({
      targetRole: roleToAnalyze,
      studentProfile: context.studentProfile,
      subjects: context.subjects,
      academicRecords: context.academicRecords,
      quizAttempts: context.quizAttempts,
    })

    careerPlan.skillGapAnalysis = {
      ...analysis,
      analyzedAt: new Date(),
    }

    await careerPlan.save()

    sendSuccess(res, 200, {
      skillGapAnalysis: careerPlan.skillGapAnalysis,
    })
  } catch (err) {
    next(err)
  }
}
