import client from './client'

export const getRecords = (subjectId) =>
  client
    .get('/academic-records', { params: subjectId ? { subjectId } : {} })
    .then((r) => r.data.data)

export const createRecord = (data) =>
  client.post('/academic-records', data).then((r) => r.data.data)

export const updateRecord = (id, data) =>
  client.patch(`/academic-records/${id}`, data).then((r) => r.data.data)

export const deleteRecord = (id) =>
  client.delete(`/academic-records/${id}`).then((r) => r.data.data)
