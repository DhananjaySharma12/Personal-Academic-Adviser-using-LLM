/**
 * studyPlan.controller.js — AI-generated weekly study plans with task completion tracking.
 * Scoped strictly to req.user.id.
 */
import { z } from 'zod'
import StudyPlan from '../models/StudyPlan.js'
import StudentProfile from '../models/StudentProfile.js'
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import { generateStudyPlan } from '../services/ai/gemini.service.js'
import { ok, created } from '../utils/response.js'
import { notFound, badRequest } from '../utils/ApiError.js'

// ── Validation schemas ────────────────────────────────────────────────────────
export const generatePlanSchema = z.object({
  weekLabel: z.string().trim().max(60).optional().default('Current Week'),
  focus: z.string().trim().max(300).optional().default(''),
  weeklyHours: z.coerce.number().min(1).max(168).optional(),
})

export const updateTaskSchema = z.object({
  completed: z.boolean(),
  notes: z.string().trim().max(500).optional(),
})

// ── Helper: gather student context (same as chat) ─────────────────────────────
async function getStudentContext(userId) {
  const [profile, subjects, records] = await Promise.all([
    StudentProfile.findOne({ userId }),
    Subject.find({ userId }),
    AcademicRecord.find({ userId }),
  ])

  const subjectsWithStats = subjects.map((subj) => {
    const subjRecords = records.filter(
      (r) => r.subjectId.toString() === subj._id.toString(),
    )
    let sScore = 0
    let sPossible = 0
    subjRecords.forEach((r) => {
      sScore += r.score
      sPossible += r.totalMarks
    })
    const subjTotalTopics = subj.syllabusTopics.length
    const subjCompletedTopics = subj.syllabusTopics.filter((t) => t.completed).length

    return {
      _id: subj._id,
      name: subj.name,
      code: subj.code,
      credits: subj.credits,
      targetGrade: subj.targetGrade,
      syllabusProgress:
        subjTotalTopics > 0
          ? Math.round((subjCompletedTopics / subjTotalTopics) * 100)
          : 0,
      averagePercent:
        sPossible > 0 ? Math.round((sScore / sPossible) * 100) : null,
    }
  })

  return { profile: profile || {}, subjects: subjectsWithStats }
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /api/study-plans — list all plans for user */
export async function getStudyPlans(req, res, next) {
  try {
    const plans = await StudyPlan.find({ userId: req.user.id })
      .select('_id weekLabel weeklyHours focus isActive tasks createdAt updatedAt')
      .sort({ createdAt: -1 })

    const summaries = plans.map((p) => {
      const total = p.tasks.length
      const done = p.tasks.filter((t) => t.completed).length
      return {
        _id: p._id,
        weekLabel: p.weekLabel,
        weeklyHours: p.weeklyHours,
        focus: p.focus,
        isActive: p.isActive,
        taskCount: total,
        completedCount: done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }
    })

    ok(res, summaries)
  } catch (err) {
    next(err)
  }
}

/** GET /api/study-plans/:id — get full plan with all tasks */
export async function getStudyPlanById(req, res, next) {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, userId: req.user.id })
    if (!plan) throw notFound('Study plan not found')
    ok(res, plan)
  } catch (err) {
    next(err)
  }
}

/** POST /api/study-plans — generate a new AI study plan */
export async function generateNewPlan(req, res, next) {
  try {
    const { weekLabel, focus, weeklyHours: reqHours } = req.body

    const { profile, subjects } = await getStudentContext(req.user.id)

    if (subjects.length === 0) {
      throw badRequest(
        'Please add at least one subject before generating a study plan.',
      )
    }

    const weeklyHours = reqHours ?? profile.weeklyStudyHours ?? 20

    // Call Gemini to generate tasks
    let tasks = []
    try {
      tasks = await generateStudyPlan({
        profile,
        subjects,
        weeklyHours,
        focus: focus || '',
      })
    } catch (llmErr) {
      console.error('[Gemini Study Plan Error]:', llmErr.message)
      throw badRequest(`AI study plan generation failed: ${llmErr.message}`)
    }

    const plan = await StudyPlan.create({
      userId: req.user.id,
      weekLabel: weekLabel || 'Current Week',
      weeklyHours,
      focus: focus || '',
      tasks,
      isActive: true,
    })

    // Mark previous plans as inactive
    await StudyPlan.updateMany(
      { userId: req.user.id, _id: { $ne: plan._id } },
      { $set: { isActive: false } },
    )

    created(res, plan)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/study-tasks/:taskId — toggle task completion */
export async function updateTask(req, res, next) {
  try {
    const { completed, notes } = req.body
    const { taskId } = req.params

    const plan = await StudyPlan.findOne({
      userId: req.user.id,
      'tasks._id': taskId,
    })
    if (!plan) throw notFound('Task not found')

    const task = plan.tasks.id(taskId)
    if (!task) throw notFound('Task not found')

    task.completed = completed
    if (notes !== undefined) task.notes = notes
    await plan.save()

    ok(res, task)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/study-plans/:id — delete a plan */
export async function deleteStudyPlan(req, res, next) {
  try {
    const plan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!plan) throw notFound('Study plan not found')
    ok(res, { message: 'Study plan deleted' })
  } catch (err) {
    next(err)
  }
}
