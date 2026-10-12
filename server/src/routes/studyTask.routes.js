/**
 * studyTask.routes.js — /api/study-tasks/:taskId patch endpoint.
 * Separated to match the API spec: PATCH /api/study-tasks/:id
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { updateTask, updateTaskSchema } from '../controllers/studyPlan.controller.js'

const router = Router()

router.use(authenticate)

router.patch('/:taskId', validate(updateTaskSchema), updateTask)

export default router
