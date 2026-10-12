/**
 * academicRecord.controller.js — CRUD for marks, grades, and test scores.
 * Scoped strictly to req.user.id.
 */
import { z } from 'zod'
import AcademicRecord from '../models/AcademicRecord.js'
import Subject from '../models/Subject.js'
import { ok, created } from '../utils/response.js'
import { notFound, badRequest } from '../utils/ApiError.js'

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const createRecordSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  title: z.string().trim().min(1, 'Title is required').max(120),
  type: z.enum(['exam', 'quiz', 'assignment', 'midterm', 'final', 'project', 'other']).optional().default('exam'),
  score: z.number().min(0, 'Score cannot be negative'),
  totalMarks: z.number().min(1, 'Total marks must be greater than 0'),
  weightage: z.number().min(0).max(100).optional().default(0),
  date: z.string().optional(),
  remarks: z.string().trim().max(300).optional().default(''),
})

export const updateRecordSchema = z.object({
  subjectId: z.string().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  type: z.enum(['exam', 'quiz', 'assignment', 'midterm', 'final', 'project', 'other']).optional(),
  score: z.number().min(0).optional(),
  totalMarks: z.number().min(1).optional(),
  weightage: z.number().min(0).max(100).optional(),
  date: z.string().optional(),
  remarks: z.string().trim().max(300).optional(),
})

// ── Controllers ──────────────────────────────────────────────────────────────

/** GET /api/academic-records */
export async function getRecords(req, res, next) {
  try {
    const filter = { userId: req.user.id }
    if (req.query.subjectId) {
      filter.subjectId = req.query.subjectId
    }

    const records = await AcademicRecord.find(filter)
      .populate('subjectId', 'name code color targetGrade')
      .sort({ date: -1, createdAt: -1 })

    ok(res, records)
  } catch (err) {
    next(err)
  }
}

/** POST /api/academic-records */
export async function createRecord(req, res, next) {
  try {
    const { subjectId, score, totalMarks } = req.body
    if (score > totalMarks) {
      throw badRequest('Score cannot be greater than total marks')
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id })
    if (!subject) throw notFound('Subject not found or does not belong to you')

    const record = await AcademicRecord.create({
      ...req.body,
      userId: req.user.id,
    })

    const populated = await AcademicRecord.findById(record._id).populate(
      'subjectId',
      'name code color targetGrade',
    )
    created(res, populated)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/academic-records/:id */
export async function updateRecord(req, res, next) {
  try {
    if (req.body.score !== undefined && req.body.totalMarks !== undefined) {
      if (req.body.score > req.body.totalMarks) {
        throw badRequest('Score cannot be greater than total marks')
      }
    }

    const record = await AcademicRecord.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true },
    ).populate('subjectId', 'name code color targetGrade')

    if (!record) throw notFound('Academic record not found')
    ok(res, record)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/academic-records/:id */
export async function deleteRecord(req, res, next) {
  try {
    const record = await AcademicRecord.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!record) throw notFound('Academic record not found')
    ok(res, { message: 'Record deleted successfully' })
  } catch (err) {
    next(err)
  }
}
