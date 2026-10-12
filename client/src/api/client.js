/**
 * client.js — base axios instance. Attaches Firebase ID token automatically.
 * Never puts userId in request body — server reads it from the token.
 */
import axios from 'axios'
import { auth } from '@/firebase'

const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
const normalizedBase = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`

const apiClient = axios.create({
  baseURL: normalizedBase,
  timeout: 60000, // 60s — AI generation (quiz/study plan) can take 20-40s
})

// Attach Firebase ID token to every request
apiClient.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // Continue request without token
    }
  }
  return config
})

// Normalize error shape
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ?? err.message ?? 'An unexpected error occurred'
    const code = err.response?.data?.error?.code ?? 'NETWORK_ERROR'
    const status = err.response?.status ?? 0
    const normalized = new Error(message)
    normalized.code = code
    normalized.status = status
    return Promise.reject(normalized)
  },
)

export { apiClient }
export default apiClient
