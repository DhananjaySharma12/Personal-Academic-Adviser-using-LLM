/**
 * chat.js — API client for AI conversation endpoints.
 */
import client from './client'

export const getConversations = () =>
  client.get('/conversations').then((r) => r.data.data)

export const getConversationById = (id) =>
  client.get(`/conversations/${id}`).then((r) => r.data.data)

export const createConversation = (data = {}) =>
  client.post('/conversations', data).then((r) => r.data.data)

export const updateConversation = (id, data) =>
  client.patch(`/conversations/${id}`, data).then((r) => r.data.data)

export const deleteConversation = (id) =>
  client.delete(`/conversations/${id}`).then((r) => r.data.data)

export const sendChatMessage = (data) =>
  client.post('/ai/chat', data).then((r) => r.data.data)
