import client from './client'

export const getReminders = () =>
  client.get('/reminders').then((r) => r.data.data)

export const createReminder = (payload) =>
  client.post('/reminders', payload).then((r) => r.data.data)

export const toggleReminder = (id) =>
  client.patch(`/reminders/${id}/toggle`).then((r) => r.data.data)

export const deleteReminder = (id) =>
  client.delete(`/reminders/${id}`).then((r) => r.data.data)
