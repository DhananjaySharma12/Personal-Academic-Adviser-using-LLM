/**
 * subject.routes.js — Endpoints for /api/subjects.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  createSubjectSchema,
  updateSubjectSchema,
} from '../controllers/subject.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getSubjects)
router.get('/:id', getSubjectById)
router.post('/', validate(createSubjectSchema), createSubject)
router.patch('/:id', validate(updateSubjectSchema), updateSubject)
router.delete('/:id', deleteSubject)

export default router
