'use client'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
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