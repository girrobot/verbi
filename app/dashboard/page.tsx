'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Document } from '@/types/documents'
import NavBar from '@/components/NavBar'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    } else if (user) {
      fetchDocuments()
    }

    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true)
      setTimeout(() => setShowWelcome(false), 5000)
    }
  }, [user, isLoading, router, searchParams])

  const fetchDocuments = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching documents:', error)
    } else {
      setDocuments(data as Document[])
    }
  }

  const createNewDocument = async () => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{ user_id: user.id, title: 'Untitled', content: '' }])
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        return;
      }

      if (data) {
        console.log('Document created:', data);
        router.push(`/editor/${data.id}`);
      } else {
        console.error('No data returned from document creation');
      }
    } catch (err) {
      console.error('Unexpected error during document creation:', err);
    }
  };

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
    <div>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
        {showWelcome && (
          <div className="fixed top-4 right-4 bg-green-50 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Welcome to Verbi, {user.user_metadata.first_name}! Let&apos;s start writing.</span>
          </div>
        )}

        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Your Documents</h1>
            <button
              onClick={createNewDocument}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              New Document
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {documents.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">You have no documents yet.</p>
              <button
                onClick={createNewDocument}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Start a New Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white p-4 rounded-lg shadow-md">
                  <a
                    href={`/editor/${doc.id}`}
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {doc.title}
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 