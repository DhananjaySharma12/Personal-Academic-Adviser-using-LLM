import mongoose from 'mongoose'

const answerResultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, default: '' },
    selectedOptionIndex: { type: Number, default: -1 },
    correctOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
)

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    answers: [answerResultSchema],
  },
  { timestamps: true }
)

export default mongoose.model('QuizAttempt', quizAttemptSchema)
