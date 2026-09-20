import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Email aur Password dono zaroori hain.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token)
        if (res.data.data.user?.role === 'finance_agent') {
          navigate('/agent-panel')
        } else if (res.data.data.user?.role === 'wholesaler') {
          navigate('/store')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(res.data.message || 'Login failed.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server se connect nahi ho pa raha. Backend check karein.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-container login-mobile-fix">
      {/* Left side panel */}
      <div className="login-left-panel">
        <div className="login-left-content">
          {/* Hexagon Logo */}
          <div className="login-logo-brand">
            <img
              src="/logo.png"
              alt="Maa Veshno Mobile Logo"
              className="login-brand-image"
            />
            <div className="login-brand-text">
              <span className="login-brand-title">MAA VESHNO</span>
              <span className="login-brand-subtitle">MOBILE</span>
            </div>
          </div>

          <h1 className="login-welcome-title">Welcome Back!</h1>
          <p className="login-welcome-desc">
            Sign in to your admin account and manage your system efficiently.
          </p>

          {/* Clean Dashboard illustration image */}
          <div className="login-illustration-wrapper">
            <img
              src="/login_illustration.png"
              alt="Dashboard ERP Illustration"
              className="login-illustration-img"
            />
          </div>
        </div>
      </div>

      {/* Right side login form */}
      <div className="login-right-panel">
        <div className="login-card-container">
          {/* Shield User Avatar Header */}
          <div className="login-avatar-header">
            <div className="login-avatar-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                {/* Shield badge */}
                <path d="M18 7c0 0 0-3 3-3c3 0 3 3 3 3c0 6-3 8-3 8c0 0-3-2-3-8Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="1"/>
              </svg>
            </div>
            <h2 className="login-panel-title">Maa Veshno Login</h2>
            <p className="login-panel-subtitle">Enter your credentials to access the system</p>
          </div>

          {/* Form alert error */}
          {error && <div className="login-error-message">{error}</div>}

          {/* Login Form */}
          <form className="login-form-fields" onSubmit={handleSubmit}>
            <div className="form-group-custom">
              <label className="form-label-custom" htmlFor="email">Email Address or Username</label>
              <div className="input-with-icon-wrapper">
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="text"
                  className="form-input-custom"
                  placeholder="Enter your email or username"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom" htmlFor="password">Password</label>
              <div className="input-with-icon-wrapper">
                <span className="input-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-custom"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login-form-options">
              <label className="remember-me-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); alert('Password reset functionality has not been configured yet.') }}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                'Logging in...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Login
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-or-divider">
            <span className="or-divider-text">or</span>
          </div>

          {/* Copyright footer */}
          <div className="login-footer-copyright">
            © 2025 Maa Veshno Mobile. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
