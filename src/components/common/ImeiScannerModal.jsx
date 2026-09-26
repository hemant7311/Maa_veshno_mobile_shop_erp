import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const ImeiScannerModal = ({ onClose, onScan }) => {
  const [error, setError] = useState('')
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const scannerRef = useRef(null)

  useEffect(() => {
    let html5Qrcode = null

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Prefer back camera if available
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))
          const cameraId = backCam ? backCam.id : devices[0].id
          setSelectedCameraId(cameraId)

          html5Qrcode = new Html5Qrcode('qr-reader-element')
          scannerRef.current = html5Qrcode

          await html5Qrcode.start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 150 } },
            (decodedText) => {
              if (decodedText) {
                const cleaned = String(decodedText).trim()
                if (cleaned) {
                  onScan(cleaned)
                }
              }
            },
            (errorMessage) => {
              // Ignore scan frame error messages
            }
          )
        } else {
          setError('No camera found on this device.')
        }
      } catch (err) {
        console.error('Camera permission or initialization error:', err)
        setError('Camera permission denied or camera not available. You can still enter IMEI manually.')
      }
    }

    initScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.warn('Failed to stop camera:', err))
        scannerRef.current = null
      }
    }
  }, [onScan])

  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value
    setSelectedCameraId(newCameraId)
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.start(
          newCameraId,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (decodedText) {
              const cleaned = String(decodedText).trim()
              if (cleaned) onScan(cleaned)
            }
          },
          () => {}
        )
      } catch (err) {
        console.error('Failed to switch camera:', err)
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Camera / Barcode Scanner</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Point camera at IMEI or Barcode</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
          {cameras.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">Select Camera</label>
              <select className="form-select" value={selectedCameraId} onChange={handleCameraChange}>
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                ))}
              </select>
            </div>
          )}

          <div
            id="qr-reader-element"
            style={{ width: '100%', minHeight: '260px', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
          />

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-outline" onClick={onClose}>Close Scanner</button>
        </div>
      </div>
    </div>
  )
}

export default ImeiScannerModal
