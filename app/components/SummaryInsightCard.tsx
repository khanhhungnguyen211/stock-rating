// app/components/SummaryInsightCard.tsx

'use client'

import { CombinedSummary } from '@/lib/buildCombinedSummary'

interface SummaryInsightCardProps {
  summary: CombinedSummary
}

export default function SummaryInsightCard({ summary }: SummaryInsightCardProps) {
  const { headlineShort, headlineLong, entryZone, tpZone, safetyTag, bullets, suggestion, knowledge } = summary

  const getSafetyConfig = (tag: 'safe' | 'watch' | 'unsafe') => {
    switch (tag) {
      case 'safe':
        return {
          label: 'An toàn',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
        }
      case 'watch':
        return {
          label: 'Theo dõi thêm',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        }
      case 'unsafe':
        return {
          label: 'Không an toàn',
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
        }
    }
  }

  const safetyConfig = getSafetyConfig(safetyTag)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
      {/* Dòng 1: Title + Safety Tag */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Nhận định tổng quan</h2>
        <span
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${safetyConfig.bgColor} ${safetyConfig.textColor} ${safetyConfig.borderColor}`}
        >
          {safetyConfig.label}
        </span>
      </div>

      {/* Dòng 2: Headlines */}
      <div className="mb-6">
        <p className="text-base md:text-lg font-semibold text-gray-900 leading-relaxed mb-2">
          {headlineShort}
        </p>
        {headlineLong && (
          <p className="text-sm text-gray-600 leading-relaxed">{headlineLong}</p>
        )}
      </div>

      {/* Dòng 3: Vùng giá quan trọng (1 section) */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Vùng giá quan trọng
        </h3>
        <div className="space-y-2">
          {entryZone ? (
            <div className="text-sm text-gray-700">
              <span className="font-medium">Vào lệnh tham khảo:</span>{' '}
              <span className="font-semibold text-gray-900">
                {entryZone.from.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} –{' '}
                {entryZone.to.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Vào lệnh tham khảo: Chưa có vùng vào lệnh an toàn
            </div>
          )}
          {tpZone ? (
            <div className="text-sm text-gray-700">
              <span className="font-medium">Chốt lời tham khảo:</span>{' '}
              <span className="font-semibold text-gray-900">
                {tpZone.from.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} –{' '}
                {tpZone.to.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Chốt lời tham khảo: Chưa có vùng chốt lời</div>
          )}
        </div>
      </div>

      {/* Dòng 4: Bullets */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Vì sao lại như vậy?
        </h3>
        <ul className="space-y-2">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed flex-1">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dòng 5: Suggestion */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Gợi ý cho người mới
        </h3>
        <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-lg p-4">
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">{suggestion}</p>
        </div>
      </div>

      {/* Dòng 6: Knowledge */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Góc kiến thức nhỏ
        </h3>
        <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{knowledge}</p>
        </div>
      </div>
    </section>
  )
}

