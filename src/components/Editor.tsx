'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Placeholder from '@tiptap/extension-placeholder'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'
import Tooltip from './Tooltip'

interface EditorAnalytics {
  wordCount: number
  readingTime: number
  readabilityScore: number
  sentiment: 'positive' | 'neutral' | 'negative'
  suggestions: Array<{
    type: 'grammar' | 'style' | 'clarity'
    message: string
    position: { from: number; to: number }
  }>
}

interface EditorHistory {
  entries: Array<{
    timestamp: Date
    type: 'content' | 'format'
    description: string
  }>
}

interface SuggestionData {
  type: string;
  content: string;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

function calculateReadabilityGradeLevel(text: string, words: number, sentences: number): number {
  if (words === 0 || sentences === 0) return 0;
  const syllables = countSyllables(text);
  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.round(Math.max(0, gradeLevel));
}

function countSyllables(text: string): number {
  return text.toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[^aeiou]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

function getSentimentColor(sentiment: 'positive' | 'neutral' | 'negative'): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-500'
    case 'negative':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

function handleSuggestion(suggestion: SuggestionData, action: string) {
  // ...
}

function ToolbarButton({ 
  isActive = false, 
  onClick, 
  children,
  disabled = false,
  tooltip = '',
  shortcut = ''
}: { 
  isActive?: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  tooltip?: string
  shortcut?: string
}) {
  return (
    <Tooltip content={tooltip} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all ${
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : isActive 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        {children}
      </button>
    </Tooltip>
  )
}

const CustomKeyboardShortcuts = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-y': () => this.editor.commands.redo(),
      'Shift-Mod-z': () => this.editor.commands.redo(),
      'Mod-Alt-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-Alt-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-b': () => this.editor.commands.toggleBold(),
      'Mod-i': () => this.editor.commands.toggleItalic(),
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    }
  },
})

export default function Editor({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<EditorAnalytics>({
    wordCount: 0,
    readingTime: 0,
    readabilityScore: 0,
    sentiment: 'neutral',
    suggestions: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState<EditorHistory>({
    entries: []
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing here...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Bold,
      Italic,
      Strike,
      Code,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HorizontalRule,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      CustomKeyboardShortcuts,
    ],
    content: '',
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none'
      }
    },
    immediatelyRender: false
  })

  const handleContentUpdate = useCallback(
    debounce(async (content: string) => {
      try {
        setIsSaving(true)
        const words = content.trim().split(/\s+/).filter(Boolean).length
        const readingTime = Math.ceil(words / 200)
        const sentences = content.split(/[.!?]+/).filter(Boolean).length
        const gradeLevel = calculateReadabilityGradeLevel(content, words, sentences)

        setAnalytics(prev => ({
          ...prev,
          wordCount: words,
          readingTime,
          readabilityScore: gradeLevel
        }))
        // Add history entry
        setHistory(prev => ({
          ...prev,
          entries: [
            {
              timestamp: new Date(),
              type: 'content' as const,
              description: `Changed content (${words} words)`
            },
            ...prev.entries
          ].slice(0, 50) // Keep last 50 entries
        }))

        if (userId) {
          await supabase
            .from('drafts')
            .upsert({
              user_id: userId,
              content,
              updated_at: new Date().toISOString()
            })
        }
      } catch (err) {
        console.error('Content update error:', err)
      } finally {
        setIsSaving(false)
      }
    }, 1000),
    [userId]
  )

  useEffect(() => {
    if (editor) {
      editor.on('update', () => {
        handleContentUpdate(editor.getText())
      })
    }
  }, [editor, handleContentUpdate])

  if (!editor) {
    return <div className="animate-pulse h-[600px] bg-gray-100 rounded-lg" />
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-8">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col panel overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip="Undo"
              shortcut="⌘Z"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 0 1 4 4v2m-6-6l-3-3m0 0L5 4m3 3H3" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip="Redo"
              shortcut="⌘⇧Z"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a4 4 0 0 0-4 4v2m6-6l3-3m0 0l3-3m-3 3h-6" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              tooltip="Heading 1"
              shortcut="⌘⌥1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14M5 12h14M5 20h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              tooltip="Heading 2"
              shortcut="⌘⌥2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              tooltip="Bold"
              shortcut="⌘B"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              tooltip="Italic"
              shortcut="⌘I"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-9M14 20H5M15 4L9 20" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              tooltip="Strike"
              shortcut="⌘T"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M7 8h10M9 16h6" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              tooltip="Bullet List"
              shortcut="⌘⌥3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              tooltip="Ordered List"
              shortcut="⌘⌥4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              tooltip="Blockquote"
              shortcut="⌘⌥5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              tooltip="Horizontal Rule"
              shortcut="⌘⌥R"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              tooltip="Align Left"
              shortcut="⌘⇧L"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              tooltip="Align Center"
              shortcut="⌘⇧E"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              tooltip="Align Right"
              shortcut="⌘⇧R"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              tooltip="Justify"
              shortcut="⌘⌥J"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </ToolbarButton>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-white to-gray-50/50">
          <div className="max-w-3xl mx-auto h-full px-4">
            <EditorContent editor={editor} className="ProseMirror h-full" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Auto-saving enabled</span>
              </div>
            </div>
            {isSaving ? (
              <div className="text-blue-600 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving changes...</span>
              </div>
            ) : (
              <div className="text-emerald-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>All changes saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 flex flex-col gap-6 stack-panel">
        {/* Analytics Card */}
        <div className="panel">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Document Analytics</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-gray-50/50 rounded-2xl p-4 backdrop-blur-sm">
              <dt className="text-sm text-gray-500">Words</dt>
              <dd className="text-2xl font-semibold text-gray-900 mt-1">{analytics.wordCount}</dd>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 backdrop-blur-sm">
              <dt className="text-sm text-gray-500">Reading Time</dt>
              <dd className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.readingTime}<span className="text-base font-normal text-gray-500 ml-1">min</span>
              </dd>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 backdrop-blur-sm">
              <dt className="text-sm text-gray-500">Grade Level</dt>
              <dd className="text-2xl font-semibold text-gray-900 mt-1">{analytics.readabilityScore}</dd>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 backdrop-blur-sm">
              <dt className="text-sm text-gray-500">Tone</dt>
              <dd className={`text-2xl font-semibold mt-1 ${getSentimentColor(analytics.sentiment)}`}>
                {analytics.sentiment.charAt(0).toUpperCase() + analytics.sentiment.slice(1)}
              </dd>
            </div>
          </div>
        </div>

        {/* History Panel */}
        <div className="flex-1 panel">
          <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
          <div className="space-y-3 overflow-auto max-h-[calc(100vh-24rem)]">
            {history.entries.map((entry, index) => (
              <div
                key={index}
                className="p-3 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.type === 'content' ? 'Content Change' : 'Format Change'}
                  </span>
                  <time className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </time>
                </div>
                <p className="text-sm text-gray-600">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}