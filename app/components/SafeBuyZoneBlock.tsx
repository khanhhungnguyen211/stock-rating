// app/components/SafeBuyZoneBlock.tsx

'use client'

import { SafeBuyZone, SafetyLevel } from '@/lib/evaluateSafeBuyZone'

interface SafeBuyZoneBlockProps {
  safeBuyZone: SafeBuyZone
}

export default function SafeBuyZoneBlock({ safeBuyZone }: SafeBuyZoneBlockProps) {
  const { zone, safetyLevel, reasons, suggestion } = safeBuyZone

  const getSafetyConfig = (level: SafetyLevel) => {
    switch (level) {
      case 'safe':
        return {
          label: 'An toàn',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-800',
        }
      case 'watch':
        return {
          label: 'Theo dõi',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
        }
      case 'unsafe':
        return {
          label: 'Không an toàn',
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-800',
        }
    }
  }

  const config = getSafetyConfig(safetyLevel)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          Vùng giá an toàn
        </h2>
        <span
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${config.badgeBg} ${config.badgeText} ${config.borderColor}`}
        >
          {config.label}
        </span>
      </div>

      {/* Zone Range */}
      {zone[0] > 0 && zone[1] > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Vùng giá an toàn
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Từ</div>
              <div className="text-lg md:text-xl font-bold text-gray-900">
                {zone[0].toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Đến</div>
              <div className="text-lg md:text-xl font-bold text-gray-900">
                {zone[1].toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reasons */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Vì sao?
        </h3>
        <ul className="space-y-3">
          {reasons.map((reason, index) => (
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

      {/* Suggestion */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
          Gợi ý
        </h3>
        <div className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-lg p-4`}>
          <p className={`text-sm md:text-base ${config.textColor} leading-relaxed`}>
            {suggestion}
          </p>
        </div>
      </div>
    </section>
  )
}

