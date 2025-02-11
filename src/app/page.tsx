'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Editor from '@/components/Editor'

export default function HomePage() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen p-4">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Verbi</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <Editor />
      </div>
    </main>
  )
} 