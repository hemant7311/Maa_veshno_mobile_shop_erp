/**
 * Frontend Validation Helpers
 */

export const IMEI_REGEX = /^\d{15}$/
export const MOBILE_REGEX = /^[6-9]\d{9}$/

/**
 * Validates IMEI (exactly 15 numeric digits)
 * @param {string} val 
 * @returns {boolean}
 */
export const isValidIMEI = (val) => {
  if (!val) return false
  return IMEI_REGEX.test(String(val).trim())
}

/**
 * Validates Indian Mobile (exactly 10 numeric digits starting with 6-9)
 * @param {string} val 
 * @returns {boolean}
 */
export const isValidMobile = (val) => {
  if (!val) return false
  const str = String(val).trim()
  return MOBILE_REGEX.test(str)
}

/**
 * Filter handler for input change (only allows digits up to maxLen)
 * @param {string} value 
 * @param {number} maxLen 
 * @returns {string}
 */
export const filterNumericInput = (value, maxLen = 15) => {
  if (!value) return ''
  return String(value).replace(/\D/g, '').slice(0, maxLen)
}
