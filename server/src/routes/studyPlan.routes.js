/**
 * studyPlan.routes.js — /api/study-plans and /api/study-tasks endpoints.
 */
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  getStudyPlans,
  getStudyPlanById,
  generateNewPlan,
  updateTask,
  deleteStudyPlan,
  generatePlanSchema,
  updateTaskSchema,
} from '../controllers/studyPlan.controller.js'

const router = Router()

router.use(authenticate)

// Study plans
router.get('/', getStudyPlans)
router.get('/:id', getStudyPlanById)
router.post('/', validate(generatePlanSchema), generateNewPlan)
router.delete('/:id', deleteStudyPlan)

// Task-level updates — nested under study-tasks resource
router.patch('/tasks/:taskId', validate(updateTaskSchema), updateTask)

export default router
