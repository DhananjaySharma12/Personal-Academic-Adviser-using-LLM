import axios from 'axios'
import { auth } from '@/firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000,
})

api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // Continue request without token if token retrieval fails
    }
  }
  return config
})

export default api
export { api }
