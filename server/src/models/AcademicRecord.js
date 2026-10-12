/**
 * AcademicRecord.js — Tracks marks/grades for quizzes, exams, assignments, etc.
 * Scoped to user and linked to Subject.
 */
import mongoose from 'mongoose'

const academicRecordSchema = new mongoose.Schema(
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
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ['exam', 'quiz', 'assignment', 'midterm', 'final', 'project', 'other'],
      default: 'exam',
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    weightage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  { timestamps: true },
)

export default mongoose.model('AcademicRecord', academicRecordSchema)
