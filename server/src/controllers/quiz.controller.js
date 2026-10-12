import { z } from 'zod'
import Quiz from '../models/Quiz.js'
import QuizAttempt from '../models/QuizAttempt.js'
import Subject from '../models/Subject.js'
import { generateQuizQuestions } from '../services/ai/gemini.service.js'
import { ok, created } from '../utils/response.js'
import { badRequest, notFound } from '../utils/ApiError.js'

export const generateQuizSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  topic: z.string().trim().min(2, 'Topic must be at least 2 characters').max(150),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  quizType: z.enum(['mcq', 'true_false', 'short_answer', 'code_problem', 'mixed']).default('mcq'),
  numQuestions: z.coerce.number().min(3).max(15).default(5),
  title: z.string().trim().max(100).optional(),
})

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().min(0),
      selectedOptionIndex: z.number(),
    })
  ),
})

/**
 * POST /api/quizzes/generate
 * Creates an AI-generated quiz and saves it to MongoDB.
 */
export async function generateQuiz(req, res, next) {
  try {
    const { subjectId, topic, difficulty, quizType = 'mcq', numQuestions, title } = req.body

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id })
    if (!subject) throw notFound('Subject not found or does not belong to you')

    const generatedQuestions = await generateQuizQuestions({
      subjectName: subject.name,
      topic,
      difficulty,
      quizType,
      numQuestions,
    })

    const quizTitle =
      title || `${subject.name}: ${topic} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`

    const quiz = await Quiz.create({
      userId: req.user.id,
      subjectId: subject._id,
      title: quizTitle,
      topic,
      difficulty,
      quizType,
      questions: generatedQuestions,
    })

    // Return sanitized quiz (without revealing answers immediately)
    const sanitizedQuestions = quiz.questions.map((q, idx) => ({
      _id: q._id,
      index: idx,
      question: q.question,
      options: q.options,
    }))

    created(res, {
      _id: quiz._id,
      title: quiz.title,
      subject: { _id: subject._id, name: subject.name, color: subject.color },
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      quizType: quiz.quizType,
      totalQuestions: quiz.questions.length,
      questions: sanitizedQuestions,
      createdAt: quiz.createdAt,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/quizzes
 * List all quizzes created for the user (includes questions so quizzes can start immediately).
 */
export async function getQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id })
      .populate('subjectId', 'name code color')
      .sort({ createdAt: -1 })

    const summaries = quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      subject: q.subjectId || { name: 'General', color: '#8B5CF6' },
      topic: q.topic,
      difficulty: q.difficulty,
      quizType: q.quizType || 'mcq',
      questionCount: q.questions.length,
      questions: q.questions.map((ques, idx) => ({
        _id: ques._id,
        index: idx,
        question: ques.question,
        options: ques.options,
      })),
      createdAt: q.createdAt,
    }))

    ok(res, summaries)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/quizzes/:id
 * Retrieve a quiz. Correct answers are stripped unless explicitly already completed.
 */
export async function getQuizById(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('subjectId', 'name code color')

    if (!quiz) throw notFound('Quiz not found')

    const sanitizedQuestions = quiz.questions.map((q, idx) => ({
      _id: q._id,
      index: idx,
      question: q.question,
      options: q.options,
    }))

    ok(res, {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subjectId || { name: 'General', color: '#8B5CF6' },
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      quizType: quiz.quizType || 'mcq',
      totalQuestions: quiz.questions.length,
      questions: sanitizedQuestions,
      createdAt: quiz.createdAt,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/quizzes/:id/submit
 * Evaluates answers server-side, records score, reveals explanations.
 */
export async function submitQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id })
    if (!quiz) throw notFound('Quiz not found')

    const { answers = [] } = req.body

    const answersMap = new Map()
    answers.forEach((a) => answersMap.set(a.questionIndex, a.selectedOptionIndex))

    let score = 0
    const detailedResults = quiz.questions.map((q, idx) => {
      const selected = answersMap.has(idx) ? answersMap.get(idx) : -1
      const isCorrect = selected === q.correctOptionIndex
      if (isCorrect) score += 1

      return {
        questionIndex: idx,
        questionText: q.question,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
        options: q.options,
      }
    })

    const totalQuestions = quiz.questions.length
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      quizId: quiz._id,
      subjectId: quiz.subjectId,
      score,
      totalQuestions,
      percentage,
      answers: detailedResults.map((r) => ({
        questionIndex: r.questionIndex,
        questionText: r.questionText,
        selectedOptionIndex: r.selectedOptionIndex,
        correctOptionIndex: r.correctOptionIndex,
        isCorrect: r.isCorrect,
        explanation: r.explanation,
      })),
    })

    ok(res, {
      attemptId: attempt._id,
      quizId: quiz._id,
      title: quiz.title,
      score,
      totalQuestions,
      percentage,
      results: detailedResults,
      createdAt: attempt.createdAt,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/quiz-attempts
 * Returns history of all quiz attempts.
 */
export async function getQuizAttempts(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id })
      .populate('quizId', 'title topic difficulty')
      .populate('subjectId', 'name code color')
      .sort({ createdAt: -1 })

    ok(res, attempts)
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/quizzes/:id
 */
export async function deleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!quiz) throw notFound('Quiz not found')

    // Also delete linked attempts
    await QuizAttempt.deleteMany({ quizId: quiz._id, userId: req.user.id })

    ok(res, { message: 'Quiz and its history deleted' })
  } catch (err) {
    next(err)
  }
}
