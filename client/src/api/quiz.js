import client from './client'

export const generateQuiz = (data) =>
  client.post('/quizzes/generate', data).then((r) => r.data.data)

export const getQuizzes = () =>
  client.get('/quizzes').then((r) => r.data.data)

export const getQuizById = (id) =>
  client.get(`/quizzes/${id}`).then((r) => r.data.data)

export const submitQuiz = (id, answers) =>
  client.post(`/quizzes/${id}/submit`, { answers }).then((r) => r.data.data)

export const getQuizAttempts = () =>
  client.get('/quiz-attempts').then((r) => r.data.data)

export const deleteQuiz = (id) =>
  client.delete(`/quizzes/${id}`).then((r) => r.data.data)
