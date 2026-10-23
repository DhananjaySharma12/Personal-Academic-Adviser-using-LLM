/**
 * subject.controller.js — CRUD for student subjects and syllabus topics.
 * Scoped strictly to req.user.id.
 */
import { z } from 'zod'
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import { ok, created } from '../utils/response.js'
import { notFound, conflict } from '../utils/ApiError.js'

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Subject name is required').max(100),
  code: z.string().trim().max(20).optional().default(''),
  credits: z.number().min(0).max(30).optional().default(3),
  color: z.string().optional().default('#7c3aed'),
  targetGrade: z.string().trim().max(10).optional().default('A'),
  syllabusTopics: z
    .array(
      z.object({
        topic: z.string().trim().min(1),
        completed: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default([]),
})

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().max(20).optional(),
  credits: z.number().min(0).max(30).optional(),
  color: z.string().optional(),
  targetGrade: z.string().trim().max(10).optional(),
  syllabusTopics: z
    .array(
      z.object({
        topic: z.string().trim().min(1),
        completed: z.boolean().optional().default(false),
      }),
    )
    .optional(),
})

// Helper to escape regex special characters
function escapeRegex(text) {
  return (text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Controllers ──────────────────────────────────────────────────────────────

/** GET /api/subjects */
export async function getSubjects(req, res, next) {
  try {
    const subjects = await Subject.find({ userId: req.user.id }).sort({ createdAt: -1 })
    ok(res, subjects)
  } catch (err) {
    next(err)
  }
}

/** GET /api/subjects/:id */
export async function getSubjectById(req, res, next) {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user.id })
    if (!subject) throw notFound('Subject not found')
    ok(res, subject)
  } catch (err) {
    next(err)
  }
}

/** POST /api/subjects */
export async function createSubject(req, res, next) {
  try {
    const trimmedName = (req.body.name || '').trim()
    const trimmedCode = (req.body.code || '').trim()

    // Duplicate check for this user (case-insensitive name and code)
    const existing = await Subject.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      code: { $regex: new RegExp(`^${escapeRegex(trimmedCode)}$`, 'i') },
    })
    if (existing) {
      throw conflict(
        `A subject with the name "${trimmedName}"${trimmedCode ? ` and code "${trimmedCode}"` : ''} already exists.`,
      )
    }

    const subject = await Subject.create({
      ...req.body,
      name: trimmedName,
      code: trimmedCode.toUpperCase(),
      userId: req.user.id,
    })
    created(res, subject)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/subjects/:id */
export async function updateSubject(req, res, next) {
  try {
    const current = await Subject.findOne({ _id: req.params.id, userId: req.user.id })
    if (!current) throw notFound('Subject not found')

    const targetName = req.body.name !== undefined ? req.body.name.trim() : current.name
    const targetCode = req.body.code !== undefined ? req.body.code.trim().toUpperCase() : current.code

    // Duplicate check if renaming or changing code
    if (req.body.name !== undefined || req.body.code !== undefined) {
      const duplicate = await Subject.findOne({
        _id: { $ne: req.params.id },
        userId: req.user.id,
        name: { $regex: new RegExp(`^${escapeRegex(targetName)}$`, 'i') },
        code: { $regex: new RegExp(`^${escapeRegex(targetCode)}$`, 'i') },
      })
      if (duplicate) {
        throw conflict(
          `Another subject with the name "${targetName}"${targetCode ? ` and code "${targetCode}"` : ''} already exists.`,
        )
      }
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { ...req.body, name: targetName, code: targetCode } },
      { new: true, runValidators: true },
    )
    ok(res, subject)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/subjects/:id */
export async function deleteSubject(req, res, next) {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!subject) throw notFound('Subject not found')
    // Cascade delete related records
    await AcademicRecord.deleteMany({ subjectId: req.params.id, userId: req.user.id })
    ok(res, { message: 'Subject and associated records deleted' })
  } catch (err) {
    next(err)
  }
}
