/**
 * client.js — base axios instance. Attaches JWT from localStorage automatically.
 * Never puts userId in request body — server reads it from the token.
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000, // 60s — AI generation (quiz/study plan) can take 20-40s
})

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('paa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
