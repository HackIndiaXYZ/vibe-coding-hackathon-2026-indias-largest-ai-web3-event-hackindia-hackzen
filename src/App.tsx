import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'

// 1. Authentication Context
interface User {
  id: number
  email: string
  fullname: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('p2p_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          // Token expired or invalid
          logout()
        }
      } catch (e) {
        console.error("Failed to authenticate token", e)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [token])

  const login = (jwtToken: string, userData: User) => {
    localStorage.setItem('p2p_token', jwtToken)
    setToken(jwtToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('p2p_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

// 2. Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 font-medium animate-pulse">Verifying credentials...</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// 3. Main App Assembly
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
