/**
 * Subject.js — Academic subject model.
 * Scoped to user via userId.
 */
import mongoose from 'mongoose'

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    credits: {
      type: Number,
      min: 0,
      max: 30,
      default: 3,
    },
    color: {
      type: String,
      default: '#7c3aed', // primary accent
    },
    targetGrade: {
      type: String,
      trim: true,
      default: 'A',
    },
    syllabusTopics: [
      {
        topic: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
)

export default mongoose.model('Subject', subjectSchema)
