import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Navbar } from '../components/ui/Navbar'
import { authService } from '../services/authService'
import { validatePassword, isPasswordValid } from '../utils/passwordValidation'

type RegisterPageProps = {
  navigate: (page: string) => void
}

export function RegisterPage({ navigate }: RegisterPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle account creation logic 
    setError('')
    setInfoMessage('')

    // validate password requirements
    const passwordValidation = validatePassword(password)
    if (!isPasswordValid(passwordValidation)) {
      setError('Password does not meet the requirements. It must be at least 8 characters long and include uppercase, lowercase, number, and special character.')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await authService.userRegister({
        name: fullName,
        email: email,
        phone: phone,
        password: password,
      })

      setInfoMessage(res.message)
    } catch (err: any) {
      const responseData = err.response?.data
      const detail = responseData?.detail
      console.log('Registration error:', err.response?.data || err.message || err)

      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join(', '))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError(responseData?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FAF6EC] text-[#0E0D0B] dark:bg-[#0E0D0B] dark:text-[#F0EAD6] transition-colors flex flex-col">
      <Navbar navigate={navigate} activePage="register" />

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

          <div className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase tracking-widest mb-1">
            Create Account
          </div>
          <h1 className="text-3xl font-black mb-8 text-[#0E0D0B] dark:text-[#F0EAD6]" style={{ fontFamily: 'Fraunces, serif' }}>
            Get started
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          
          {/* Registration Form */}
          { infoMessage ? (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {infoMessage}
            </div>) : (            
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                  />
                </div>

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
                    Register only using @students.oamk.fi or @oamk.fi email addresses.
              </p>
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+358 40 1234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
                  />
                </div>

                <div>
                  <label className="block mono text-[10px] uppercase tracking-widest text-[#524B43] dark:text-[#B8B0A4] mb-1.5">
                    Password
                  </label>
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
                  className="w-full h-11 mt-4 bg-[#D93B2B] text-[#FAF6EC] mono text-xs uppercase tracking-widest font-bold hover:bg-[#BF3323] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create Account →
                </button>
              </form>
          )}

          <p className="mt-6 text-center mono text-xs text-[#524B43] dark:text-[#B8B0A4]">
            Already have an account?{' '}
            <button
              onClick={() => navigate('login')}
              className="text-[#D93B2B] hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}