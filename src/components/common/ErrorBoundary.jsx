import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleLogout = () => {
    sessionStorage.removeItem('erp_user')
    sessionStorage.removeItem('erp_token')
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '32px 16px',
          textAlign: 'center',
          background: 'var(--bg, #f8fafc)',
          color: 'var(--text-primary, #0f172a)'
        }}>
          <div style={{
            background: 'var(--white, #ffffff)',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
            maxWidth: '480px',
            width: '100%',
            border: '1px solid var(--border, #e2e8f0)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--danger, #dc2626)' }}>
              Page Rendering Error
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', marginBottom: '24px' }}>
              An unexpected error occurred while loading this view. You can reload or return to the login page.
            </p>
            {this.state.error?.message && (
              <pre style={{
                fontSize: '12px',
                background: '#f1f5f9',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                color: '#334155'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Reload Page
              </button>
              <button
                className="btn btn-outline"
                onClick={this.handleLogout}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
