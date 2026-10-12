/**
 * conversation.controller.js — Handles AI chats and conversation sessions.
 * Scoped strictly to req.user.id.
 */
import { z } from 'zod'
import Conversation from '../models/Conversation.js'
import StudentProfile from '../models/StudentProfile.js'
import Subject from '../models/Subject.js'
import AcademicRecord from '../models/AcademicRecord.js'
import {
  generateAcademicChat,
  generateConversationTitle,
} from '../services/ai/gemini.service.js'
import { ok, created } from '../utils/response.js'
import { notFound, badRequest } from '../utils/ApiError.js'

// ── Validation schemas ───────────────────────────────────────────────────────
export const createConversationSchema = z.object({
  title: z.string().trim().max(100).optional().default('New Chat'),
})

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(100),
})

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1, 'Message cannot be empty').max(10000),
})

// ── Helper: Gather student context for grounding ─────────────────────────────
async function getStudentContext(userId) {
  const [profile, subjects, records] = await Promise.all([
    StudentProfile.findOne({ userId }),
    Subject.find({ userId }),
    AcademicRecord.find({ userId }),
  ])

  let totalScore = 0
  let totalPossible = 0
  records.forEach((r) => {
    totalScore += r.score
    totalPossible += r.totalMarks
  })

  let totalTopics = 0
  let completedTopics = 0

  const subjectsWithStats = subjects.map((subj) => {
    const subjRecords = records.filter(
      (r) => r.subjectId.toString() === subj._id.toString(),
    )
    let sScore = 0
    let sPossible = 0
    subjRecords.forEach((r) => {
      sScore += r.score
      sPossible += r.totalMarks
    })

    const subjTotalTopics = subj.syllabusTopics.length
    const subjCompletedTopics = subj.syllabusTopics.filter((t) => t.completed).length

    totalTopics += subjTotalTopics
    completedTopics += subjCompletedTopics

    return {
      _id: subj._id,
      name: subj.name,
      code: subj.code,
      credits: subj.credits,
      targetGrade: subj.targetGrade,
      syllabusProgress:
        subjTotalTopics > 0
          ? Math.round((subjCompletedTopics / subjTotalTopics) * 100)
          : 0,
      averagePercent:
        sPossible > 0 ? Math.round((sScore / sPossible) * 100) : null,
    }
  })

  return {
    profile: profile || {},
    subjects: subjectsWithStats,
    stats: {
      totalSubjects: subjects.length,
      totalAssessments: records.length,
      overallAverage:
        totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
      overallSyllabusProgress:
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    },
  }
}

// ── Controllers ──────────────────────────────────────────────────────────────

/** GET /api/conversations */
export async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .select('_id title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })

    // Return lightweight summary with preview
    const summaries = conversations.map((conv) => {
      const lastMsg = conv.messages[conv.messages.length - 1]
      return {
        _id: conv._id,
        title: conv.title,
        messageCount: conv.messages.length,
        lastMessagePreview: lastMsg
          ? lastMsg.content.substring(0, 80) + (lastMsg.content.length > 80 ? '...' : '')
          : 'Empty chat',
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }
    })

    ok(res, summaries)
  } catch (err) {
    next(err)
  }
}

/** POST /api/conversations */
export async function createConversation(req, res, next) {
  try {
    const title = req.body.title || 'New Chat'
    const conversation = await Conversation.create({
      userId: req.user.id,
      title,
      messages: [],
    })
    created(res, conversation)
  } catch (err) {
    next(err)
  }
}

/** GET /api/conversations/:id */
export async function getConversationById(req, res, next) {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!conversation) throw notFound('Conversation not found')
    ok(res, conversation)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/conversations/:id */
export async function updateConversation(req, res, next) {
  try {
    const { title } = req.body
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { title } },
      { new: true },
    )
    if (!conversation) throw notFound('Conversation not found')
    ok(res, conversation)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/conversations/:id */
export async function deleteConversation(req, res, next) {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!conversation) throw notFound('Conversation not found')
    ok(res, { message: 'Conversation deleted' })
  } catch (err) {
    next(err)
  }
}

/** POST /api/ai/chat */
export async function sendMessage(req, res, next) {
  try {
    const { conversationId, message } = req.body

    let conversation = null

    if (conversationId && conversationId !== 'new') {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user.id,
      })
      if (!conversation) throw notFound('Conversation not found')
    } else {
      // Create a fresh conversation
      conversation = new Conversation({
        userId: req.user.id,
        title: 'New Chat',
        messages: [],
      })
    }

    // Append user message
    conversation.messages.push({
      role: 'user',
      content: message,
    })

    // Gather grounded context
    const studentContext = await getStudentContext(req.user.id)

    // Call Gemini LLM
    let aiResponseText = ''
    try {
      aiResponseText = await generateAcademicChat({
        messages: conversation.messages,
        studentContext,
      })
    } catch (llmErr) {
      console.error('[Gemini API Error]:', llmErr.message)
      throw badRequest(`AI service error: ${llmErr.message}`)
    }

    // Append assistant response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponseText,
    })

    // If title was default 'New Chat', auto-generate concise title
    if (conversation.title === 'New Chat') {
      const generatedTitle = await generateConversationTitle(message, aiResponseText)
      conversation.title = generatedTitle
    }

    await conversation.save()

    const lastMessage = conversation.messages[conversation.messages.length - 1]

    ok(res, {
      conversationId: conversation._id,
      title: conversation.title,
      reply: lastMessage,
      conversation,
    })
  } catch (err) {
    next(err)
  }
}
