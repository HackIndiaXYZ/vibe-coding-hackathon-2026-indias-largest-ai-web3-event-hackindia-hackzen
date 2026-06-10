import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../App'
import { Cpu, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams()
  const isSignUpDefault = searchParams.get('mode') === 'signup'
  
  const [isSignUp, setIsSignUp] = useState(isSignUpDefault)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { login, token } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard')
    }
  }, [token, navigate])

  // Sync state if query param changes
  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        // Register API Call
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullname })
        })

        if (!registerRes.ok) {
          const errData = await registerRes.json()
          throw new Error(errData.detail || "Registration failed")
        }
      }

      // Login API Call
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      })

      if (!loginRes.ok) {
        const errData = await loginRes.json()
        throw new Error(errData.detail || "Invalid login credentials")
      }

      const authData = await loginRes.json()
      login(authData.access_token, authData.user)
      navigate('/dashboard')

    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-gray-100 flex items-center justify-center p-6 overflow-hidden">
      {/* Background glowing effects */}
      <div className="glowing-orb top-[-150px] right-[-100px]"></div>
      <div className="glowing-orb-emerald bottom-[-150px] left-[-150px]"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Banner */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">SaaSMiner AI</h2>
          <p className="text-xs text-gray-500 font-medium">Turn Codebases into SaaS Opportunities</p>
        </div>

        {/* Panel Container */}
        <div className="glass-panel rounded-3xl p-8 border border-gray-800 shadow-2xl relative">
          <h3 className="text-xl font-bold mb-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h3>
          <p className="text-xs text-gray-400 mb-6 font-medium">
            {isSignUp 
              ? "Gain secure access to local project analyzers." 
              : "Enter your secure local credentials to log in."}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-300 font-semibold"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-bold tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    required 
                    placeholder="Jane Doe" 
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  required 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-bold tracking-wide">Password</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={() => alert("Password reset is handled locally. Check your sqlite database or register a new user.")}
                    className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-500/15 hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Access Console"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="text-center mt-6">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-xs text-gray-400 hover:text-white font-semibold transition-colors"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "New here? Create a local account"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
