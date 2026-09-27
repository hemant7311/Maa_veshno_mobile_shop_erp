import React, { useEffect, useRef, useState } from 'react'
import { isValidIMEI } from '../../utils/validators'

const ImeiScannerModal = ({ onClose, onScan }) => {
  const [scannedInput, setScannedInput] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const rawValue = scannedInput.trim()

    // USB Hardware Scanner validation rule:
    // Raw value must be EXACTLY 15 numeric digits.
    // If >15, <15, or contains non-digits, REJECT with "IMEI must be exactly 15 digits."
    if (!rawValue || rawValue.length !== 15 || !/^\d{15}$/.test(rawValue) || !isValidIMEI(rawValue)) {
      setError('IMEI must be exactly 15 digits.')
      return
    }

    setError('')
    onScan(rawValue)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setScannedInput(val)
    if (error) setError('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Hardware / USB Barcode Scanner</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scan IMEI using USB Hardware Scanner</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '24px 16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              Scan 15-Digit IMEI Barcode
            </label>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Scan barcode with USB scanner..."
              value={scannedInput}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ fontSize: '16px', padding: '10px 12px', width: '100%', letterSpacing: '1px', fontFamily: 'monospace' }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger, #ef4444)', fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Scanned IMEI</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImeiScannerModal
