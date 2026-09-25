import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Navbar } from '../components/ui/Navbar'

type RegisterPageProps = {
  navigate: (page: string) => void
}

export function RegisterPage({ navigate }: RegisterPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle account creation logic 
    navigate('home')
  }

  const handleGoogleRegister = () => {
    // Handle Google sign up / register logic 
    navigate('home')
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

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full h-11 mb-6 border border-[#C4BAA6] dark:border-[#2A2925] bg-white dark:bg-[#1A1916] flex items-center justify-center gap-3 mono text-xs font-bold hover:bg-[#F2ECE1] dark:hover:bg-[#252420] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#C4BAA6] dark:bg-[#2A2925]" />
            <span className="mono text-[10px] text-[#524B43] dark:text-[#B8B0A4] uppercase">or email</span>
            <div className="flex-1 h-px bg-[#C4BAA6] dark:bg-[#2A2925]" />
          </div>

          {/* Registration Form */}
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
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-3 mono text-xs bg-[#FAF6EC] dark:bg-[#1A1916] border border-[#C4BAA6] dark:border-[#2A2925] text-[#0E0D0B] dark:text-[#F0EAD6] placeholder:text-[#524B43] dark:placeholder:text-[#8C8377] focus:outline-none focus:ring-2 focus:ring-[#D93B2B]"
              />
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