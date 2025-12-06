'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-md transition-shadow duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left group"
      >
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors">
          {title}
        </h2>
        <svg
          className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-gray-100 pt-6">{children}</div>}
    </section>
  )
}

