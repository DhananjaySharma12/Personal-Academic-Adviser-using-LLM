/**
 * auth.js — Auth helper endpoints.
 * Custom register and login calls have been removed in favor of Firebase Authentication.
 */
import apiClient from './client.js'

export const authApi = {
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data.data),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }).then((r) => r.data.data),
}
