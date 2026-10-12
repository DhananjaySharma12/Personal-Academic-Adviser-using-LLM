/**
 * academicRecord.routes.js — Endpoints for /api/academic-records.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  createRecordSchema,
  updateRecordSchema,
} from '../controllers/academicRecord.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getRecords)
router.post('/', validate(createRecordSchema), createRecord)
router.patch('/:id', validate(updateRecordSchema), updateRecord)
router.delete('/:id', deleteRecord)

export default router
