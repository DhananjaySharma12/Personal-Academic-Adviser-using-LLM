/**
 * auth.js — API calls for auth endpoints.
 * All calls go through the base axios client (auto-attaches JWT).
 */
import apiClient from './client.js'

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data).then((r) => r.data.data),
  login: (data) => apiClient.post('/auth/login', data).then((r) => r.data.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }).then((r) => r.data.data),
}

