'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Editor from '@/components/Editor'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }

    // Show welcome message if it's first login
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true)
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }, [user, isLoading, router, searchParams])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {showWelcome && (
        <div className="fixed top-4 right-4 bg-green-50 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Welcome to Verbi, {user.user_metadata.first_name}! Let's start writing.</span>
        </div>
      )}

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.user_metadata.first_name}</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <Editor userId={user.id} />
        </div>
      </main>
    </div>
  )
} 