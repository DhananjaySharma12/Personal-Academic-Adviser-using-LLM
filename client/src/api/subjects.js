import client from './client'

export const getSubjects = () => client.get('/subjects').then((r) => r.data.data)
export const getSubjectById = (id) => client.get(`/subjects/${id}`).then((r) => r.data.data)
export const createSubject = (data) => client.post('/subjects', data).then((r) => r.data.data)
export const updateSubject = (id, data) => client.patch(`/subjects/${id}`, data).then((r) => r.data.data)
export const deleteSubject = (id) => client.delete(`/subjects/${id}`).then((r) => r.data.data)
