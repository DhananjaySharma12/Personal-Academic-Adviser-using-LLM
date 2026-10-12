/**
 * profile.js — API calls for /api/profile.
 */
import apiClient from './client.js'

export const profileApi = {
  get: () => apiClient.get('/profile').then((r) => r.data.data),
  update: (data) => apiClient.put('/profile', data).then((r) => r.data.data),
  uploadAvatar: (avatarUrl) =>
    apiClient.put('/profile', { avatarUrl }).then((r) => r.data.data),
}
