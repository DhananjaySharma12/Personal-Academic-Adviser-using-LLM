/**
 * studyPlanner.js — API client for study plan endpoints.
 */
import client from './client'

export const getStudyPlans = () =>
  client.get('/study-plans').then((r) => r.data.data)

export const getStudyPlanById = (id) =>
  client.get(`/study-plans/${id}`).then((r) => r.data.data)

export const generateStudyPlan = (data) =>
  client.post('/study-plans', data).then((r) => r.data.data)

export const deleteStudyPlan = (id) =>
  client.delete(`/study-plans/${id}`).then((r) => r.data.data)

export const updateTask = (taskId, data) =>
  client.patch(`/study-tasks/${taskId}`, data).then((r) => r.data.data)
