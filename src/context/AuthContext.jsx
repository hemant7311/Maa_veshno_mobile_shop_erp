import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('erp_user')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch (error) {
      sessionStorage.removeItem('erp_user')
      sessionStorage.removeItem('erp_token')
      return null
    }
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('erp_token') || null)

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    sessionStorage.setItem('erp_user', JSON.stringify(userData))
    sessionStorage.setItem('erp_token', authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem('erp_user')
    sessionStorage.removeItem('erp_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
