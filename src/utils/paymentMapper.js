export const PAYMENT_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank Transfer',
  cheque: 'Cheque',
  card: 'Card',
  credit: 'Credit',
  finance: 'Finance',
  other: 'Other'
}

export const normalizePaymentMethod = (method) => {
  if (!method) return 'cash'
  const val = String(method).trim()
  const lower = val.toLowerCase()
  if (lower === 'cash') return 'cash'
  if (lower === 'upi' || lower === 'online') return 'upi'
  if (lower === 'bank' || lower === 'bank transfer') return 'bank'
  if (lower === 'cheque' || lower === 'check') return 'cheque'
  if (lower === 'card') return 'card'
  if (lower === 'credit') return 'credit'
  if (lower === 'finance') return 'finance'
  return 'other'
}

export const getPaymentLabel = (method) => {
  const canonical = normalizePaymentMethod(method)
  return PAYMENT_LABELS[canonical] || 'Cash'
}
