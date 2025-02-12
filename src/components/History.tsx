'use client'

import { useState } from 'react'

interface HistoryEntry {
  timestamp: Date
  type: 'content' | 'format'
  description: string
}

interface HistoryProps {
  entries: HistoryEntry[]
  onRestore: (index: number) => void
}

export default function History({ entries, onRestore }: HistoryProps) {
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
      <div className="overflow-auto flex-1">
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                selectedEntry === index
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-gray-50 hover:bg-gray-100 border-transparent'
              } border`}
              onClick={() => setSelectedEntry(index)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {entry.type === 'content' ? 'Content Change' : 'Format Change'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{entry.description}</p>
              {selectedEntry === index && (
                <button
                  onClick={() => onRestore(index)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 