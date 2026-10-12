import client from './client'

/** Fetch user's career plan & current recommendations */
export const getCareerGuidance = () =>
  client.get('/career').then((r) => r.data.data)

/** Regenerate recommendations with custom preferences */
export const generateRecommendations = (payload = {}) =>
  client.post('/career/recommendations', payload).then((r) => r.data.data)

/** Update aspirations without regenerating recommendations */
export const updateCareerPreferences = (payload) =>
  client.put('/career/preferences', payload).then((r) => r.data.data)

/** Toggle bookmark for a role */
export const toggleBookmarkRole = (roleData) =>
  client.post('/career/bookmark', roleData).then((r) => r.data.data)

/** Analyze deep skill gap for a specific target role */
export const analyzeSkillGap = (targetRole) =>
  client.post('/career/skill-gap', { targetRole }).then((r) => r.data.data)
