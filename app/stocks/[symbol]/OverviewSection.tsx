'use client'

import { useState } from 'react'
import ValuationExplanation from './ValuationExplanation'

import { HybridInsightData } from '@/app/components/HybridInsightCard'

/**
 * Generate hybrid summary text combining technical and fundamental insights
 */
function generateHybridSummary(hybridInsight: HybridInsightData, valuation: any, insights: any): string {
  const { shortTerm, fundamentals, combinedSignal } = hybridInsight
  
  // Build summary based on combined signal and key factors
  const parts: string[] = []
  
  // Signal-based opening
  if (combinedSignal === 'Bullish') {
    parts.push('Cổ phiếu đang có tín hiệu tích cực')
  } else if (combinedSignal === 'Risky') {
    parts.push('Cổ phiếu đang có mức rủi ro cao')
  } else {
    parts.push('Cổ phiếu đang ở trạng thái trung tính')
  }
  
  // Add trend info
  if (shortTerm.trendMode === 'UP') {
    parts.push('với xu hướng tăng ngắn hạn')
  } else if (shortTerm.trendMode === 'DOWN') {
    parts.push('với xu hướng giảm ngắn hạn')
  } else {
    parts.push('với xu hướng đi ngang')
  }
  
  // Add valuation info
  if (valuation.discount > 0.1) {
    parts.push(`và đang được định giá rẻ hơn ${(valuation.discount * 100).toFixed(1)}% so với giá trị hợp lý`)
  } else if (valuation.discount < -0.1) {
    parts.push(`nhưng đang được định giá đắt hơn ${Math.abs(valuation.discount * 100).toFixed(1)}% so với giá trị hợp lý`)
  } else {
    parts.push('và đang được định giá ở mức hợp lý')
  }
  
  // Add fundamental health
  if (fundamentals.financialHealthLabel === 'Tăng trưởng mạnh') {
    parts.push('với sức khỏe tài chính tốt')
  } else if (fundamentals.financialHealthLabel === 'Suy yếu' || fundamentals.financialHealthLabel === 'Nợ cao') {
    parts.push('nhưng cần lưu ý về sức khỏe tài chính')
  }
  
  // Add volume/volatility context
  if (shortTerm.volumeMode === 'HIGH' && shortTerm.volatility === 'HIGH') {
    parts.push('với biến động và khối lượng giao dịch cao, cần thận trọng')
  } else if (shortTerm.volumeMode === 'LOW' && shortTerm.volatility === 'LOW') {
    parts.push('với biến động và khối lượng giao dịch thấp, ổn định')
  }
  
  return parts.join(', ') + '.'
}

interface OverviewSectionProps {
  valuation: any
  insights: any
  stock: any
  hybridInsight?: HybridInsightData
}

export default function OverviewSection({ valuation, insights, stock, hybridInsight }: OverviewSectionProps) {
  const [activeTab, setActiveTab] = useState<'valuation' | 'technical' | 'fundamental' | null>(null)

  return (
    <>
      {/* ============================================
          [1] NHẬN ĐỊNH TỔNG QUAN
          ============================================ */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
        {/* Quick Summary */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">Nhận định tổng quan</h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-3xl">
                {hybridInsight 
                  ? generateHybridSummary(hybridInsight, valuation, insights)
                  : valuation.summary
                }
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full text-lg md:text-xl font-bold text-white shadow-md ${
                  valuation.score >= 70
                    ? 'bg-emerald-600'
                    : valuation.score >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              >
                {Math.round(valuation.score)}
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  valuation.zone === 'deep_value' || valuation.zone === 'value'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : valuation.zone === 'fair'
                    ? 'bg-gray-50 text-gray-700 border-gray-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {valuation.zoneLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Card Insight trên 1 hàng */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Định giá */}
          <div className="bg-white rounded-xl p-4 md:p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Định giá</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
              P/E: {valuation.peCurrent.toFixed(1)}
            </div>
            <div className={`text-xs font-semibold ${
              valuation.discount > 0 ? 'text-emerald-700' : valuation.discount < 0 ? 'text-rose-700' : 'text-gray-700'
            }`}>
              {valuation.discount > 0 ? 'Rẻ hơn' : valuation.discount < 0 ? 'Đắt hơn' : 'Hợp lý'}{' '}
              {Math.abs(valuation.discount * 100).toFixed(1)}%
            </div>
          </div>

          {/* Xu hướng */}
          <div className="bg-white rounded-xl p-4 md:p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Xu hướng</div>
            <div className={`text-xl md:text-2xl font-bold tracking-tight mb-1 ${
              insights.trend.roc10 >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {insights.trend.roc10 >= 0 ? '+' : ''}
              {insights.trend.roc10.toFixed(1)}%
            </div>
            <div className="text-xs font-semibold text-gray-700">
              {insights.trend.trend === 'uptrend'
                ? 'Tăng'
                : insights.trend.trend === 'downtrend'
                ? 'Giảm'
                : insights.trend.trend === 'volatile'
                ? 'Biến động'
                : 'Đi ngang'}
            </div>
          </div>

          {/* Rủi ro */}
          <div className="bg-white rounded-xl p-4 md:p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Rủi ro</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
              {insights.risk.volatility20.toFixed(1)}%
            </div>
            <div className={`text-xs font-semibold ${
              insights.risk.level === 'low' 
                ? 'text-emerald-700' 
                : insights.risk.level === 'medium' 
                ? 'text-amber-700' 
                : 'text-rose-700'
            }`}>
              {insights.risk.level === 'low' ? 'Thấp' : insights.risk.level === 'medium' ? 'Trung bình' : 'Cao'}
            </div>
          </div>

          {/* Tài chính */}
          <div className="bg-white rounded-xl p-4 md:p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tài chính</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-1">
              ROE: {stock.roe.toFixed(1)}%
            </div>
            <div className="text-xs font-semibold text-gray-700">
              {insights.fundamental.health === 'strong_growth'
                ? 'Tăng trưởng mạnh'
                : insights.fundamental.health === 'stable'
                ? 'Ổn định'
                : insights.fundamental.health === 'weakening'
                ? 'Suy yếu'
                : 'Nợ cao'}
            </div>
          </div>
        </div>

        {/* Tabs để xem chi tiết */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Xem chi tiết</h3>
            {activeTab && (
              <button
                onClick={() => setActiveTab(null)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
              >
                Thu gọn
              </button>
            )}
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab(activeTab === 'valuation' ? null : 'valuation')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'valuation'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              Định giá
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'technical' ? null : 'technical')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'technical'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              Xu hướng kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'fundamental' ? null : 'fundamental')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'fundamental'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              Phân tích doanh nghiệp
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'valuation' && (
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">P/E hiện tại</div>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight">{valuation.peCurrent.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">P/E hợp lý</div>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight">{valuation.fairPE.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Giá trị hợp lý</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">
                    {valuation.fairValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}{' '}
                    <span className="text-xs font-normal text-gray-500">VND</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Điểm đánh giá</div>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      valuation.score >= 70
                        ? 'text-emerald-600'
                        : valuation.score >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {Math.round(valuation.score)}<span className="text-sm text-gray-500 font-normal">/100</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Nhận xét</h4>
                <p className="text-xs text-gray-700 leading-relaxed">{valuation.summary}</p>
              </div>
              {valuation.explanation && valuation.explanation.length > 0 && (
                <div className="mt-4">
                  <ValuationExplanation explanation={valuation.explanation} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Chỉ số kỹ thuật</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">ROC 10 ngày</span>
                      <span className={`text-sm font-semibold ${insights.trend.roc10 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {insights.trend.roc10 >= 0 ? '+' : ''}
                        {insights.trend.roc10.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">MA20</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(insights.trend.ma20 * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                      </span>
                    </div>
                    {insights.trend.ma50 !== undefined && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">MA50</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(insights.trend.ma50 * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Biến động ngắn hạn</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {insights.trend.volatilityShort.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-gray-500">Độ biến động 20 phiên</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {insights.risk.volatility20.toFixed(2)}%/ngày
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Nhận xét</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">{insights.trend.summary}</p>
                      {insights.trend.explanation && insights.trend.explanation.length > 0 && (
                        <ul className="space-y-1 text-xs text-gray-500">
                          {insights.trend.explanation.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start leading-relaxed">
                              <span className="mr-2 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">{insights.risk.summary}</p>
                      {insights.risk.explanation && insights.risk.explanation.length > 0 && (
                        <ul className="space-y-1 text-xs text-gray-500">
                          {insights.risk.explanation.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start leading-relaxed">
                              <span className="mr-2 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fundamental' && (
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">EPS</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">
                    {stock.eps.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-gray-500">VND</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">ROE</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">{stock.roe.toFixed(2)}%</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tăng trưởng</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">{stock.growth_rate.toFixed(2)}%/năm</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">P/E hiện tại</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">{stock.pe.toFixed(2)}</div>
                </div>
              </div>
              <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Sức khỏe tài chính</h4>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">{insights.fundamental.summary}</p>
                {insights.fundamental.explanation && insights.fundamental.explanation.length > 0 && (
                  <ul className="space-y-1 text-xs text-gray-600">
                    {insights.fundamental.explanation.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start leading-relaxed">
                        <span className="mr-2 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

    </>
  )
}
