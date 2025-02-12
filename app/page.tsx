'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface FormData {
  email: string
  password: string
  firstName: string
  lastName: string
  rememberMe: boolean
}

interface FormValidation {
  email: boolean
  password: boolean
  firstName: boolean
  lastName: boolean
}

type SignUpState = 'idle' | 'submitting' | 'confirmation-sent' | 'error' | 'already-confirmed'

type ResendState = 'idle' | 'sending' | 'sent' | 'error'

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    rememberMe: false
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSuccess] = useState(false)
  const [formValidation, setFormValidation] = useState<FormValidation>({
    email: false,
    password: false,
    firstName: false,
    lastName: false
  })
  const [signUpState, setSignUpState] = useState<SignUpState>('idle')
  const [resendState, setResendState] = useState<ResendState>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setFormValidation({
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      password: formData.password.length >= 6,
      firstName: !isSignUp || formData.firstName.length >= 2,
      lastName: !isSignUp || formData.lastName.length >= 2
    })
  }, [formData, isSignUp])

  const isFormValid = () => {
    return Object.values(formValidation).every(Boolean)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const getInputClassName = (fieldName: 'email' | 'password' | 'firstName' | 'lastName') => {
    const baseClasses = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
    const isValid = formValidation[fieldName]
    const showError = touched[fieldName] && !isValid

    return `${baseClasses} ${
      showError 
        ? 'border-red-300 focus:ring-red-200' 
        : isValid 
          ? 'border-green-300 focus:ring-green-200 scale-100 hover:scale-[1.02]' 
          : 'border-gray-300 focus:ring-blue-200'
    }`
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (error) throw error

      // Wait for session to be set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Use router.replace instead of window.location
      router.replace('/dashboard')
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'Failed to authenticate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })
  }

  const handleResendConfirmation = async () => {
    try {
      setResendState('sending')
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      })
      
      if (error) throw error
      
      setResendState('sent')
      setTimeout(() => setResendState('idle'), 5000)
    } catch (err) {
      setResendState('error')
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation')
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const renderSignUpState = () => {
    switch (signUpState) {
      case 'submitting':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Creating your account...</p>
            </div>
          </div>
        )

      case 'confirmation-sent':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10 rounded-lg p-8">
            <div className="text-center">
              <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Check your email</h3>
              <p className="text-gray-600 mb-4">
                We've sent a confirmation link to<br />
                <span className="font-medium">{formData.email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Click the link in the email to activate your account
              </p>
              
              <div className="mb-4">
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendState === 'sending' || resendState === 'sent'}
                  className={`text-sm ${
                    resendState === 'sent'
                      ? 'text-green-500 cursor-default'
                      : resendState === 'error'
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-blue-500 hover:text-blue-600'
                  } transition-colors`}
                >
                  {resendState === 'sending' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : resendState === 'sent' ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmation email resent
                    </span>
                  ) : resendState === 'error' ? (
                    'Try resending confirmation email'
                  ) : (
                    "Didn't receive the email? Resend confirmation"
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setSignUpState('idle')
                  setIsModalOpen(false)
                  setFormData({ email: '', password: '', firstName: '', lastName: '', rememberMe: false })
                }}
                className="text-gray-500 hover:text-gray-600"
              >
                Close this window
              </button>
            </div>
          </div>
        )

      case 'already-confirmed':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10 rounded-lg p-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Account Already Exists</h3>
              <p className="text-gray-600 mb-4">
                You already have an account with this email.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsSignUp(false)
                    setSignUpState('idle')
                  }}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign in instead
                </button>
                <button
                  onClick={() => {
                    setSignUpState('idle')
                    setIsModalOpen(false)
                    setFormData({ email: '', password: '', firstName: '', lastName: '', rememberMe: false })
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10 rounded-lg p-8">
            <div className="text-center">
              <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p className="text-red-600 mb-4">
                {error || 'Something went wrong'}
              </p>
              <button
                onClick={() => {
                  setSignUpState('idle')
                  setError(null)
                }}
                className="text-blue-500 hover:text-blue-600"
              >
                Try again
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 ${isModalOpen ? 'blur-sm' : ''}`}>
        <div className="max-w-2xl text-center px-4">
          <h1 className="text-4xl font-bold mb-4">Welcome to Verbi</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered writing assistant for clear, concise, and impactful writing.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            {renderSignUpState()}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isSignUp ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSignUp ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-6 text-center">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>

            {isSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10 rounded-lg transition-opacity duration-500">
                <div className="text-green-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Check your email to confirm your account!</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="mb-6 space-y-4 relative">
              {isSignUp && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName('firstName')}
                      required={isSignUp}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClassName('lastName')}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName('email')}
                  required
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => {/* We can add password reset here later */}}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Forgot password?
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isFormValid() && !isLoading
                    ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>

              {isFormValid() && (
                <div className="text-sm text-green-500 flex items-center gap-1 justify-center mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All fields are valid</span>
                </div>
              )}
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => handleOAuthSignIn('google')}
              className="w-full bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>

            <button
              onClick={() => handleOAuthSignIn('apple')}
              className="w-full bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 12.536c-.031-3.013 2.459-4.462 2.572-4.531-1.402-2.047-3.584-2.329-4.362-2.357-1.848-.19-3.621 1.094-4.558 1.094-.957 0-2.415-1.069-3.975-1.038-2.021.031-3.894 1.182-4.94 2.997-2.121 3.681-.541 9.102 1.508 12.072 1.021 1.462 2.22 3.104 3.795 3.045 1.53-.062 2.105-.981 3.954-.981 1.831 0 2.367.981 3.965.944 1.641-.025 2.677-1.482 3.67-2.957 1.172-1.688 1.649-3.339 1.674-3.426-.038-.012-3.197-1.226-3.229-4.862z" />
              </svg>
              Sign in with Apple
            </button>

            <div className="text-center text-sm text-gray-600">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="hover:text-blue-500"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}