// app/components/HybridInsightCard.tsx

'use client'

import { useState } from 'react'
import { ShortTermAnalysis } from '@/lib/analysis/shortTermEngine'
import FinancialSection from './FinancialSection'

export type CombinedSignal = 'Bullish' | 'Neutral' | 'Risky'

export interface RatioAnalysis {
  value: number
  label: string
  color: 'emerald' | 'blue' | 'amber' | 'rose'
  benchmark: string
  explanation: string
}

export interface FundamentalSnapshot {
  financialHealthLabel: string
  financialHealthData?: {
    roe: number
    debtToEquity?: number
    growthRate?: number
  }
  valuationLabel: string
  valuationData?: {
    peCurrent: number
    peFair: number
    discount: number
  }
  businessQuality: string
  businessQualityData?: {
    roe: number
    health: string
  }
  additionalRatios?: Record<string, RatioAnalysis>
  financialMetrics?: {
    lite: any
    pro: any
    summary: any
  }
}

export interface HybridInsightData {
  combinedSignal: CombinedSignal
  shortTerm: {
    trendMode: 'UP' | 'DOWN' | 'SIDEWAY'
    volumeMode: 'LOW' | 'NORMAL' | 'HIGH'
    volatility: 'LOW' | 'MEDIUM' | 'HIGH'
    entryZone: [number, number] | null
    tpZone: [number, number] | null
    slZone: [number, number] | null
  }
  fundamentals: FundamentalSnapshot
  summary: string
  suggestions: string[]
  knowledge: string
}

interface HybridInsightCardProps {
  data: HybridInsightData
  valuation?: any // For detailed tabs
  insights?: any // For detailed tabs
  stock?: any // For detailed tabs
}

export default function HybridInsightCard({ data, valuation, insights, stock }: HybridInsightCardProps) {
  const { combinedSignal, shortTerm, fundamentals, summary, suggestions, knowledge } = data
  const [isTrendExpanded, setIsTrendExpanded] = useState(false)

  const getSignalConfig = (signal: CombinedSignal) => {
    switch (signal) {
      case 'Bullish':
        return {
          label: 'Tích cực',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
        }
      case 'Risky':
        return {
          label: 'Rủi ro',
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
        }
      default:
        return {
          label: 'Trung tính',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        }
    }
  }

  const getTrendConfig = (trend: 'UP' | 'DOWN' | 'SIDEWAY') => {
    switch (trend) {
      case 'UP':
        return { label: 'Tăng', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
      case 'DOWN':
        return { label: 'Giảm', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
      default:
        return { label: 'Đi ngang', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    }
  }

  const getVolumeConfig = (volume: 'LOW' | 'NORMAL' | 'HIGH') => {
    switch (volume) {
      case 'HIGH':
        return { label: 'Cao', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
      case 'LOW':
        return { label: 'Thấp', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
      default:
        return { label: 'Bình thường', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    }
  }

  const getVolatilityConfig = (vol: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (vol) {
      case 'HIGH':
        return { label: 'Cao', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
      case 'LOW':
        return { label: 'Thấp', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
      default:
        return { label: 'Trung bình', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
    }
  }

  const signalConfig = getSignalConfig(combinedSignal)
  const trendConfig = getTrendConfig(shortTerm.trendMode)
  const volumeConfig = getVolumeConfig(shortTerm.volumeMode)
  const volatilityConfig = getVolatilityConfig(shortTerm.volatility)

  return (
    <section className="bg-gradient-to-br from-white via-white to-gray-50/20 rounded-2xl shadow-sm border border-gray-100/80 p-6 md:p-8 mb-6 hover:shadow-md transition-all duration-300">
      {/* Header - Enhanced */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200/60">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Nhận định tổng quan
          </h2>
          <p className="text-xs text-gray-500 font-medium">Phân tích kỹ thuật & cơ bản</p>
        </div>
        <div className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm ${signalConfig.bgColor} ${signalConfig.textColor} border-2 ${signalConfig.borderColor}`}>
          {signalConfig.label}
        </div>
      </div>

      {/* Technical Analysis & Trading Zones - Simplified */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
            <div className="text-sm text-gray-700 font-semibold">
              Xu hướng giá
            </div>
          </div>
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsTrendExpanded(!isTrendExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            {isTrendExpanded ? 'Thu gọn' : 'Xem chi tiết'}
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isTrendExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {/* Single Trend Indicator */}
          <div className="mb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${trendConfig.color.replace('text-', 'bg-')}`}></div>
              <span className="text-xs text-gray-600 font-medium">Xu hướng:</span>
              <span className={`text-sm font-semibold ${trendConfig.color} ml-1`}>{trendConfig.label}</span>
            </div>
          </div>

          {/* Collapsible Detailed Analysis */}
          {isTrendExpanded && insights && stock && (
            <div className="mb-5 pt-5 border-t border-gray-200">
              <div className="space-y-4">
                {/* Current Price vs Moving Averages */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Giá hiện tại & Trung bình</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Giá hiện tại</div>
                      <div className="text-base font-bold text-gray-900">
                        {(stock.price * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">MA20 (Trung bình 20 phiên)</div>
                      <div className="text-base font-bold text-gray-900">
                        {(insights.trend.ma20 * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                      </div>
                      <div className={`text-xs mt-1 ${
                        stock.price > insights.trend.ma20 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {stock.price > insights.trend.ma20 ? 'Cao hơn' : 'Thấp hơn'} {Math.abs(((stock.price - insights.trend.ma20) / insights.trend.ma20) * 100).toFixed(2)}%
                      </div>
                    </div>
                    {insights.trend.ma50 !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">MA50 (Trung bình 50 phiên)</div>
                        <div className="text-base font-bold text-gray-900">
                          {(insights.trend.ma50 * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                        </div>
                        <div className={`text-xs mt-1 ${
                          stock.price > insights.trend.ma50 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {stock.price > insights.trend.ma50 ? 'Cao hơn' : 'Thấp hơn'} {Math.abs(((stock.price - insights.trend.ma50) / insights.trend.ma50) * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Volume & Volatility */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Khối lượng & Biến động</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Khối lượng giao dịch</div>
                      <div className={`text-base font-bold ${
                        shortTerm.volumeMode === 'HIGH' 
                          ? 'text-emerald-600' 
                          : shortTerm.volumeMode === 'LOW' 
                          ? 'text-rose-600' 
                          : 'text-gray-900'
                      }`}>
                        {shortTerm.volumeMode === 'HIGH' ? 'Cao' : shortTerm.volumeMode === 'LOW' ? 'Thấp' : 'Bình thường'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {shortTerm.volumeMode === 'HIGH' 
                          ? 'Nhiều người giao dịch, thanh khoản tốt' 
                          : shortTerm.volumeMode === 'LOW' 
                          ? 'Ít người giao dịch, thanh khoản thấp' 
                          : 'Khối lượng giao dịch ổn định'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Biến động giá</div>
                      <div className={`text-base font-bold ${
                        shortTerm.volatility === 'HIGH' 
                          ? 'text-rose-600' 
                          : shortTerm.volatility === 'LOW' 
                          ? 'text-emerald-600' 
                          : 'text-amber-600'
                      }`}>
                        {shortTerm.volatility === 'HIGH' ? 'Cao' : shortTerm.volatility === 'LOW' ? 'Thấp' : 'Trung bình'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.trend.volatilityShort.toFixed(2)}% biến động ngắn hạn
                      </div>
                      {insights.risk && (
                        <div className="text-xs text-gray-500 mt-1">
                          {insights.risk.volatility20.toFixed(2)}%/ngày (20 phiên)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                {insights.trend.explanation && insights.trend.explanation.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Phân tích xu hướng</h4>
                    <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-lg p-4">
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">{insights.trend.summary}</p>
                      <ul className="space-y-1">
                        {insights.trend.explanation.map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start">
                            <span className="mr-2 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trading Zones - Simplified */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Entry Zone */}
            <div className={`p-3 rounded-lg border ${
              shortTerm.entryZone 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-gray-50/50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${shortTerm.entryZone ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium text-gray-700">Vào lệnh</span>
              </div>
              {shortTerm.entryZone ? (
                <div className="text-sm font-semibold text-gray-900">
                  {shortTerm.entryZone[0].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  -{' '}
                  {shortTerm.entryZone[1].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-gray-500">VND</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Chưa có</div>
              )}
            </div>

            {/* Take Profit Zone */}
            <div className={`p-3 rounded-lg border ${
              shortTerm.tpZone 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-gray-50/50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${shortTerm.tpZone ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium text-gray-700">Chốt lời</span>
              </div>
              {shortTerm.tpZone ? (
                <div className="text-sm font-semibold text-gray-900">
                  {shortTerm.tpZone[0].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  -{' '}
                  {shortTerm.tpZone[1].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-gray-500">VND</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Chưa có</div>
              )}
            </div>

            {/* Stop Loss Zone */}
            <div className={`p-3 rounded-lg border ${
              shortTerm.slZone 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-gray-50/50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${shortTerm.slZone ? 'bg-rose-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium text-gray-700">Cắt lỗ</span>
              </div>
              {shortTerm.slZone ? (
                <div className="text-sm font-semibold text-gray-900">
                  {shortTerm.slZone[0].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  -{' '}
                  {shortTerm.slZone[1].toLocaleString('vi-VN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-gray-500">VND</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Chưa có</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Section - Morningstar/Simply Wall St Style */}
      {fundamentals.financialMetrics && fundamentals.valuationData && fundamentals.financialHealthData && (
        <FinancialSection
          lite={fundamentals.financialMetrics.lite}
          pro={fundamentals.financialMetrics.pro}
          summary={fundamentals.financialMetrics.summary}
          roe={fundamentals.financialHealthData.roe}
          peCurrent={fundamentals.valuationData.peCurrent}
          peFair={fundamentals.valuationData.peFair}
          discount={fundamentals.valuationData.discount}
          additionalRatios={fundamentals.additionalRatios}
        />
      )}


      {/* Action For Beginners - Enhanced */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Gợi ý cho người mới
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50/50 to-blue-50/30 rounded-xl border border-amber-200/50 p-5 shadow-sm">
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">{suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Knowledge Hint - Enhanced */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Góc kiến thức nhỏ
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-xl border border-indigo-200/50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed flex-1">{knowledge}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
