'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import BulletList from '@tiptap/extension-bullet-list'
import TextAlign from '@tiptap/extension-text-align'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faItalic, faUnderline, faStrikethrough, faListUl, faAlignLeft, faAlignCenter, faAlignRight, faUndo, faRedo } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditorPage() {
  const router = useRouter()
  const { id } = useParams()
  const [title, setTitle] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    onUpdate: async ({ editor }) => {
      const content = editor.getHTML()
      try {
        const { error } = await supabase
          .from('documents')
          .update({ content })
          .eq('id', id)
        if (error) {
          console.error('Error updating document:', error)
        }
      } catch (err) {
        console.error('Unexpected error during document update:', err)
      }
    },
  })

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('title, content')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error loading document:', error)
          router.push('/dashboard')
        } else if (data) {
          setTitle(data.title)
          editor?.commands.setContent(data.content)
        } else {
          console.error('No document found with the given ID')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Unexpected error during document fetch:', err)
        router.push('/dashboard')
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id, editor, router])

  const updateTitle = async (newTitle: string) => {
    setTitle(newTitle)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ title: newTitle })
        .eq('id', id)
      if (error) {
        console.error('Error updating title:', error)
      }
    } catch (err) {
      console.error('Unexpected error during title update:', err)
    }
  }

  if (!editor) {
    console.log('Editor not initialized')
    return <div className="animate-pulse h-[600px] bg-gray-100 rounded-lg" />
  }

  return (
    <div className="flex max-w-5xl mx-auto p-4 space-x-4">
      <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="text-2xl font-bold mb-4 w-full border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
          placeholder="Document Title"
        />
        <div className="toolbar mb-4 flex space-x-2">
          <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className="btn">
            <FontAwesomeIcon icon={faBold} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className="btn">
            <FontAwesomeIcon icon={faItalic} />
          </button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className="btn">
            <FontAwesomeIcon icon={faUnderline} />
          </button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className="btn">
            <FontAwesomeIcon icon={faStrikethrough} />
          </button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().chain().focus().toggleBulletList().run()} className="btn">
            <FontAwesomeIcon icon={faListUl} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className="btn">
            <FontAwesomeIcon icon={faAlignLeft} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className="btn">
            <FontAwesomeIcon icon={faAlignCenter} />
          </button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className="btn">
            <FontAwesomeIcon icon={faAlignRight} />
          </button>
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className="btn">
            <FontAwesomeIcon icon={faUndo} />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className="btn">
            <FontAwesomeIcon icon={faRedo} />
          </button>
        </div>
        <EditorContent editor={editor} className="border p-4 rounded-lg shadow-sm h-[70vh] overflow-y-auto" />
      </div>
      <div className="w-1/3 bg-gray-100 p-6 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-2">Document Analytics</h3>
        <p>Sentiment: Positive</p>
        <p>Readability: Grade 8</p>
        {/* Add more analytics as needed */}
      </div>
    </div>
  )
} 