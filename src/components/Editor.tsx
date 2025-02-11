'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function Editor({ userId }: { userId: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing...</p>',
  })

  return <EditorContent editor={editor} className="prose max-w-none" />
}
