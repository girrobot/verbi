'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (type === 'email_confirmation') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token as string,
            type: 'email',
          })
          if (error) throw error
          
          // Wait briefly to show success state
          await new Promise(resolve => setTimeout(resolve, 2000))
          router.push('/dashboard') // Or wherever you want to redirect after confirmation
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to confirm email')
      } finally {
        setIsLoading(false)
      }
    }

    confirmEmail()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 hover:underline"
        >
          Return to home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="bg-green-50 p-8 rounded-lg text-center">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
        <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
        <p className="text-gray-600">Redirecting you to the dashboard...</p>
      </div>
    </div>
  )
} 