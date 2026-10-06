import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, User } from 'lucide-react'
import { Navbar } from '../components/ui/Navbar'
import { authService, type UserInfo } from '../services/authService'

type LoginPageProps = {
  navigate: (page: string) => void,
  onLoginSuccess?: (user: UserInfo) => void
}

type AuthView = 'login' | 'forgot' | 'success' | 'new-password'

export function LoginPage({ navigate, onLoginSuccess }: LoginPageProps) {
  const [currentView, setCurrentView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async(e: React.FormEvent) => {
    e.preventDefault()
    // Handle email/password login logic 
    setError('')
    setLoading(true)

    // Simulate login process
    try{
      await authService.userLogin({
        email: email,
        password: password,
      })
      // Fetch current user info after successful login
      const user = await authService.getCurrentUser()
      onLoginSuccess?.(user)
      navigate('dashboard')
    } catch (err: any) {
        setError(err.response?.data?.detail || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      setCurrentView('success')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      setCurrentView('login')
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B] dark:bg-[#0E0D0B] dark:text-[#F0EAD6] transition-colors flex flex-col">
      <Navbar navigate={navigate} activePage="login" />

      {/* Main Content Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-1.5 mono text-xs text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] dark:hover:text-[#F0EAD6] transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>BACK</span>
            </button>
          </div>

        {currentView === 'login' && (
          <>
          <div className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest mb-1">
            Sign In
          </div>
          <h1 className="text-3xl font-black mb-8 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
            Welcome back
          </h1>

        
          {/* Email / Password Form */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@students.oamk.fi"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
              />
              <p className="mt-1 mono text-[10px] text-[#524B43] dark:text-[#B8B0A4]">
                    Login only using @students.oamk.fi or @oamk.fi email addresses.
              </p>
            </div>

            <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView('forgot')}
                      className="mono text-[10px] text-[#D93B2B] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full h-11 px-3 pr-10 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-2 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
              </form>

              <p className="mt-6 text-center mono text-xs text-[#524B43] dark:text-[#B8B0A4]">
                No account?{' '}
                <button
                  onClick={() => navigate('register')}
                  className="text-[#D93B2B] hover:underline cursor-pointer"
                >
                  Join Findory
                </button>
              </p>
            </>
          )}

          {currentView === 'forgot' && (
            <>
              <div className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest mb-1">
                Account Recovery
              </div>
              <h1 className="text-3xl font-black mb-3 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
                Reset password
              </h1>
              <p className="text-sm text-[#524B43] dark:text-[#B8B0A4] mb-8">
                Enter your @students.oamk.fi or @oamk.fi email and we’ll send you a secure link to choose a new password.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    OAMK Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@students.oamk.fi"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-2 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Sending link...' : 'Send reset link →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setCurrentView('login')}
                  className="mono text-xs font-bold text-[#0E0D0B] dark:text-[#F0EAD6] hover:underline cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {currentView === 'new-password' && (
            <>
              <div className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest mb-1">
                Security Setup
              </div>
              <h1 className="text-3xl font-black mb-3 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
                Set new password
              </h1>
              <p className="text-sm text-[#524B43] dark:text-[#B8B0A4] mb-8">
                Your identity has been verified. Please choose a secure new password for your account.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full h-11 px-3 pr-10 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#524B43] dark:text-[#B8B0A4] hover:text-[#0E0D0B] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-2 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update password →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setCurrentView('login')}
                  className="mono text-xs font-bold text-[#0E0D0B] dark:text-[#F0EAD6] hover:underline cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {currentView === 'success' && (
            <div className="text-center py-6">
              <h1 className="text-3xl font-black mb-3 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
                Check your email
              </h1>
              <p className="text-sm text-[#524B43] dark:text-[#B8B0A4] mb-8">
                We've sent a secure password reset link to <span className="font-semibold text-[#0E0D0B] dark:text-white">{email}</span>.
              </p>
              <button
                onClick={() => setCurrentView('login')}
                className="w-full h-11 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors flex items-center justify-center cursor-pointer"
              >
                Return to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}