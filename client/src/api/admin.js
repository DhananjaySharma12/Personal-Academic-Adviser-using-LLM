import client from './client'

export const getAdminStats = () =>
  client.get('/admin/stats').then((r) => r.data.data)

export const getAdminUsers = () =>
  client.get('/admin/users').then((r) => r.data.data)

export const updateUserRole = (id, role) =>
  client.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data.data)
