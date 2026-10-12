import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true, min: 0, max: 5 },
    explanation: { type: String, default: '' },
  },
  { _id: true }
)

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    quizType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer', 'code_problem', 'mixed'],
      default: 'mcq',
    },
    questions: [questionSchema],
  },
  { timestamps: true }
)

export default mongoose.model('Quiz', quizSchema)
