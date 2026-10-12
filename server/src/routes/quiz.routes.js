import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import {
  generateQuiz,
  generateQuizSchema,
  getQuizzes,
  getQuizById,
  submitQuiz,
  submitQuizSchema,
  getQuizAttempts,
  deleteQuiz,
} from '../controllers/quiz.controller.js'

const router = Router()

router.use(authenticate)

router.post('/generate', validate(generateQuizSchema), generateQuiz)
router.get('/', getQuizzes)
router.get('/attempts', getQuizAttempts)
router.get('/:id', getQuizById)
router.post('/:id/submit', validate(submitQuizSchema), submitQuiz)
router.delete('/:id', deleteQuiz)

export default router
