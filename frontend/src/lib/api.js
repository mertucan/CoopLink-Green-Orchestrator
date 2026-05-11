import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 12000
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('cooplink_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new Event('cooplink:unauthorized'))
    }
    return Promise.reject(error)
  }
)
