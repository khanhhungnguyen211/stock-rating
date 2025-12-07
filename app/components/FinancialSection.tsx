// app/components/FinancialSection.tsx

'use client'

import { FundamentalLite, FundamentalPro, FundamentalAISummary } from '@/lib/buildFinancialMetrics'

interface FinancialSectionProps {
  lite: FundamentalLite
  pro: FundamentalPro
  summary?: FundamentalAISummary
  roe: number
  peCurrent: number
  peFair: number
  discount: number
  additionalRatios?: Record<string, any>
}

export default function FinancialSection({
  lite,
  pro,
  summary,
  roe,
  peCurrent,
  peFair,
  discount,
  additionalRatios,
}: FinancialSectionProps) {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
          Tình hình tài chính
        </div>
      </div>

      {/* Snapshot Row */}
      <FinancialSnapshotRow lite={lite} growthScore={pro.growth.score} />

      {/* 3 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <FinancialCardProfitability
          profitability={pro.profitability}
          roe={roe}
          roa={additionalRatios?.roa}
          profitMargin={additionalRatios?.profitMargin}
          operatingMargin={additionalRatios?.operatingMargin}
          currentRatio={additionalRatios?.currentRatio}
          quickRatio={additionalRatios?.quickRatio}
        />
        <FinancialCardValuation
          valuation={pro.valuation}
          valuationLabel={lite.valuationLabel}
          peCurrent={peCurrent}
          peFair={peFair}
          discount={discount}
          pb={additionalRatios?.pb}
          peg={additionalRatios?.peg}
        />
        <FinancialCardGrowth
          growth={pro.growth}
          epsGrowth={additionalRatios?.epsGrowth}
          revenueGrowth={additionalRatios?.revenueGrowth}
        />
      </div>

      {/* AI Summary (optional) */}
      {summary && summary.oneLiner && (
        <div className="mt-6 pt-6 border-t border-gray-200/60">
          <p className="text-sm text-gray-600 leading-relaxed italic">{summary.oneLiner}</p>
        </div>
      )}
    </div>
  )
}

// Snapshot Row Component
function FinancialSnapshotRow({
  lite,
  growthScore,
}: {
  lite: FundamentalLite
  growthScore: number
}) {
  const getPillColor = (label: string) => {
    if (label === 'Mạnh' || label === 'Rẻ' || label === 'Thấp') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    if (label === 'Ổn định' || label === 'Hợp lý' || label === 'Trung bình') {
      return 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }

  const growthLabel = growthScore >= 7 ? 'Mạnh' : growthScore >= 4 ? 'Ổn định' : 'Chậm'

  return (
    <div className="flex flex-wrap gap-3">
      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getPillColor(lite.healthLabel)}`}>
        Sức khỏe: {lite.healthLabel}
      </div>
      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getPillColor(lite.valuationLabel)}`}>
        Định giá: {lite.valuationLabel}
      </div>
      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getPillColor(growthLabel)}`}>
        Tăng trưởng: {growthLabel}
      </div>
      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getPillColor(lite.riskLabel)}`}>
        Rủi ro: {lite.riskLabel}
      </div>
    </div>
  )
}

// Profitability Card
function FinancialCardProfitability({
  profitability,
  roe,
  roa,
  profitMargin,
  operatingMargin,
  currentRatio,
  quickRatio,
}: {
  profitability: FundamentalPro['profitability']
  roe: number
  roa?: any
  profitMargin?: any
  operatingMargin?: any
  currentRatio?: any
  quickRatio?: any
}) {
  const getBadgeLabel = (score: number) => {
    if (score >= 7) return 'Tốt'
    if (score >= 4) return 'Ổn định'
    return 'Yếu'
  }

  const getBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-emerald-100 text-emerald-700'
    if (score >= 4) return 'bg-gray-100 text-gray-700'
    return 'bg-amber-100 text-amber-700'
  }

  const getCaption = (score: number) => {
    if (score >= 7) return 'Sinh lời trên vốn ở mức tốt.'
    if (score >= 4) return 'Sinh lời trên vốn ở mức ổn định.'
    return 'Sinh lời trên vốn cần cải thiện.'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-gray-900">SỨC KHỎE TÀI CHÍNH</div>
        <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${getBadgeColor(profitability.score)}`}>
          {getBadgeLabel(profitability.score)}
        </div>
      </div>

      {/* Main metric: ROE */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-emerald-600 mb-1">{roe.toFixed(1)}%</div>
        <div className="text-xs text-gray-500">ROE</div>
      </div>

      {/* Secondary metrics */}
      <div className="space-y-2 pt-4 border-t border-gray-200/60">
        {roa && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">ROA</span>
            <span className="font-semibold text-gray-900">{roa.value.toFixed(1)}%</span>
          </div>
        )}
        {profitMargin && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Biên LN ròng</span>
            <span className="font-semibold text-gray-900">{profitMargin.value.toFixed(1)}%</span>
          </div>
        )}
        {operatingMargin && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Biên LN HĐ</span>
            <span className="font-semibold text-gray-900">{operatingMargin.value.toFixed(1)}%</span>
          </div>
        )}
        {currentRatio && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Thanh khoản</span>
            <span className="font-semibold text-gray-900">{currentRatio.value.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-4 pt-4 border-t border-gray-200/60">
        <p className="text-xs text-gray-600">{getCaption(profitability.score)}</p>
      </div>
    </div>
  )
}

// Valuation Card
function FinancialCardValuation({
  valuation,
  valuationLabel,
  peCurrent,
  peFair,
  discount,
  pb,
  peg,
}: {
  valuation: FundamentalPro['valuation']
  valuationLabel: string
  peCurrent: number
  peFair: number
  discount: number
  pb?: any
  peg?: any
}) {
  const getBadgeColor = (label: string) => {
    if (label === 'Rẻ') return 'bg-emerald-100 text-emerald-700'
    if (label === 'Hợp lý') return 'bg-gray-100 text-gray-700'
    return 'bg-amber-100 text-amber-700'
  }

  const getCaption = (label: string) => {
    if (label === 'Rẻ') return 'Định giá hấp dẫn so với giá trị hợp lý.'
    if (label === 'Hợp lý') return 'Định giá ở mức hợp lý.'
    return 'Định giá cao so với giá trị hợp lý.'
  }

  // Determine color for main metric based on valuation
  const getMainMetricColor = (label: string) => {
    if (label === 'Rẻ') return 'text-emerald-600'
    if (label === 'Hợp lý') return 'text-blue-600'
    return 'text-amber-600'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-gray-900">ĐỊNH GIÁ</div>
        <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${getBadgeColor(valuationLabel)}`}>
          {valuationLabel}
        </div>
      </div>

      {/* Main metric: P/E Current - SỐ LỚN như 2 cards kia */}
      <div className="mb-4">
        <div className={`text-3xl font-bold mb-1 ${getMainMetricColor(valuationLabel)}`}>
          {peCurrent.toFixed(1)}x
        </div>
        <div className="text-xs text-gray-500">
          P/E hiện tại{discount > 0 ? ` • Rẻ hơn ${Math.abs(discount * 100).toFixed(0)}%` : ''}
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="space-y-2 pt-4 border-t border-gray-200/60">
        {pb && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">P/B</span>
            <span className="font-semibold text-gray-900">{pb.value.toFixed(2)} • {pb.label}</span>
          </div>
        )}
        {peg && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">PEG</span>
            <span className="font-semibold text-gray-900">{peg.value.toFixed(2)} • {peg.label}</span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-4 pt-4 border-t border-gray-200/60">
        <p className="text-xs text-gray-600">{getCaption(valuationLabel)}</p>
      </div>
    </div>
  )
}

// Growth Card
function FinancialCardGrowth({
  growth,
  epsGrowth,
  revenueGrowth,
}: {
  growth: FundamentalPro['growth']
  epsGrowth?: any
  revenueGrowth?: any
}) {
  const getBadgeLabel = (score: number) => {
    if (score >= 7) return 'Tăng trưởng mạnh'
    if (score >= 4) return 'Ổn định'
    return 'Chậm lại'
  }

  const getBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-emerald-100 text-emerald-700'
    if (score >= 4) return 'bg-gray-100 text-gray-700'
    return 'bg-amber-100 text-amber-700'
  }

  const getCaption = (score: number) => {
    if (score >= 7) return 'Lợi nhuận và dòng tiền đang tăng trưởng tích cực.'
    if (score >= 4) return 'Tăng trưởng ở mức ổn định.'
    return 'Tăng trưởng đang chậm lại.'
  }

  // Get main growth value - prefer from additionalRatios, fallback to growth.metrics
  let mainGrowthValue: string | null = null
  if (epsGrowth && epsGrowth.value !== undefined) {
    mainGrowthValue = `+${epsGrowth.value.toFixed(1)}%`
  } else {
    const epsMetric = growth.metrics.find((m) => m.label.includes('EPS'))
    if (epsMetric) {
      mainGrowthValue = epsMetric.value.startsWith('+') ? epsMetric.value : `+${epsMetric.value}`
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-gray-900">TĂNG TRƯỞNG & DÒNG TIỀN</div>
        <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${getBadgeColor(growth.score)}`}>
          {getBadgeLabel(growth.score)}
        </div>
      </div>

      {/* Main metric: EPS Growth */}
      {mainGrowthValue && (
        <div className="mb-4">
          <div className="text-3xl font-bold text-emerald-600 mb-1">
            {mainGrowthValue.startsWith('+') ? mainGrowthValue : `+${mainGrowthValue}`}
          </div>
          <div className="text-xs text-gray-500">Tăng trưởng EPS</div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="space-y-2 pt-4 border-t border-gray-200/60">
        {revenueGrowth && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Doanh thu</span>
            <span className="font-semibold text-gray-900">+{revenueGrowth.value.toFixed(1)}%</span>
          </div>
        )}
        {!revenueGrowth && growth.metrics.find((m) => m.label.includes('Doanh thu')) && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Doanh thu</span>
            <span className="font-semibold text-gray-900">
              {growth.metrics.find((m) => m.label.includes('Doanh thu'))?.value}
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-4 pt-4 border-t border-gray-200/60">
        <p className="text-xs text-gray-600">{getCaption(growth.score)}</p>
      </div>
    </div>
  )
}

