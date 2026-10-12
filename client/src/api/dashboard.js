import client from './client'

export const getDashboardStats = () => client.get('/dashboard').then((r) => r.data.data)
