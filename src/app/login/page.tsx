'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default function LoginPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    redirect('/')
  }

  const handleAppleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={handleAppleSignIn}
        className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2"
      >
        Sign in with Apple
      </button>
    </div>
  )
} 