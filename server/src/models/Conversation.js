/**
 * Conversation.js — AI chat sessions for academic advisory.
 * Scoped to user via userId.
 */
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 12000,
    },
  },
  { timestamps: true },
)

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'New Chat',
    },
    messages: [messageSchema],
  },
  { timestamps: true },
)

export default mongoose.model('Conversation', conversationSchema)
