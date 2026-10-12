import client from './client'

/** Full computed analytics dashboard data */
export const getAnalyticsData = () =>
  client.get('/analytics').then((r) => r.data.data)

/** AI-generated Strength & Weakness diagnosis + action plan */
export const getAiDiagnosis = () =>
  client.get('/analytics/diagnose').then((r) => r.data.data)
