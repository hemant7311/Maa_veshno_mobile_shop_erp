const isProd = import.meta.env.PROD
let configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL

// Force absolute backend URL in production to prevent relative /uploads 404 errors on the frontend domain
if (isProd && (!configuredApiBaseUrl || configuredApiBaseUrl === '/api')) {
  configuredApiBaseUrl = 'https://api.mvmshop.store/api'
} else if (!configuredApiBaseUrl) {
  configuredApiBaseUrl = '/api'
}

// Avoid double slashes when endpoint paths are appended.
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '')
export const API_V1_URL = API_BASE_URL + '/v1'

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '')

export const getMediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/uploads')) {
    return SERVER_BASE_URL ? (SERVER_BASE_URL + url) : url
  }
  return url
}
