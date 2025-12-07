// app/components/AiInsightBlock.tsx

'use client'

import { AiInsight } from '@/lib/evaluateAiInsight'

interface AiInsightBlockProps {
  insight: AiInsight
}

export default function AiInsightBlock({ insight }: AiInsightBlockProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">
        AI Insight
      </h2>

      {/* (1) Kết luận 1 câu */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Kết luận
        </h3>
        <p className="text-base md:text-lg text-gray-900 leading-relaxed font-medium">
          {insight.conclusion}
        </p>
      </div>

      {/* (2) Vì sao lại như vậy */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Vì sao lại như vậy?
        </h3>
        <ul className="space-y-3">
          {insight.reasons.map((reason, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm md:text-base text-gray-700 leading-relaxed flex-1">
                {reason}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* (3) Gợi ý cho người mới */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Gợi ý cho người mới
        </h3>
        <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-lg p-4">
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            {insight.suggestion}
          </p>
        </div>
      </div>

      {/* (4) Góc kiến thức nhỏ */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Góc kiến thức nhỏ
        </h3>
        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            {insight.knowledge}
          </p>
        </div>
      </div>
    </section>
  )
}

