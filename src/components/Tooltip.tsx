'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  shortcut?: string
}

export default function Tooltip({ content, children, shortcut }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50">
          <div className="flex items-center gap-2">
            <span>{content}</span>
            {shortcut && (
              <>
                <span className="w-px h-3 bg-gray-700" />
                <span className="text-gray-400">{shortcut}</span>
              </>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
} 