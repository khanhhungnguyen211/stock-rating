'use client'

import { useState } from 'react'

interface ValuationExplanationProps {
  explanation: string[]
}

export default function ValuationExplanation({ explanation }: ValuationExplanationProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!explanation || explanation.length === 0) return null

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
          Giải thích công thức
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-4 bg-gray-50/50 rounded-lg p-4 border border-gray-100">
          <ul className="space-y-2">
            {explanation.map((item, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start leading-relaxed">
                <span className="mr-2 text-blue-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

