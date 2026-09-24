const isProd = import.meta.env.PROD
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || (isProd ? 'https://api.mvmshop.store/api' : '/api')

// Avoid double slashes when endpoint paths are appended.
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '')
export const API_V1_URL = `${API_BASE_URL}/v1`
