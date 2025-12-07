import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { evaluateStockInsights, mockPriceHistoryFromCurrentPrice } from '@/lib/stockInsights'
import { evaluateAiInsight } from '@/lib/evaluateAiInsight'
import { evaluateSafeBuyZone } from '@/lib/evaluateSafeBuyZone'
import { evaluatePriceZones } from '@/lib/evaluatePriceZones'
import { buildCombinedSummary } from '@/lib/buildCombinedSummary'
import { buildHybridInsight } from '@/lib/buildHybridInsight'
import HybridInsightCard from '@/app/components/HybridInsightCard'
import {
  evaluateShortTermFromVnstock,
  evaluateShortTermFromArrays,
} from '@/lib/analysis/shortTermAdapter'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
  type VnstockPriceRecord,
  type VnstockFundamentalResponse,
} from '@/lib/vnstockClient'
import { extractFundamentalRatios } from '@/lib/extractFundamentalRatios'
import PriceChart from '@/app/components/PriceChart'
import PriceHistoryTable from '@/app/components/PriceHistoryTable'

interface PageProps {
  params: {
    symbol: string
  }
}

export default async function StockDetailPage({ params }: PageProps) {
  const stock = await prisma.stock.findUnique({
    where: { symbol: params.symbol.toUpperCase() },
  })

  if (!stock) {
    notFound()
  }

  // Thử lấy dữ liệu từ vnstock service
  let vnstockPriceHistory: VnstockPriceRecord[] | null = null
  let vnstockFundamentals: VnstockFundamentalResponse | null = null

  try {
    const [priceResult, fundamentalResult] = await Promise.allSettled([
      fetchVnstockPriceHistory(stock.symbol, {
        start: '2024-01-01',
        end: new Date().toISOString().split('T')[0],
      }),
      fetchVnstockFundamentals(stock.symbol),
    ])

    if (priceResult.status === 'fulfilled') {
      vnstockPriceHistory = priceResult.value
    }

    if (fundamentalResult.status === 'fulfilled') {
      vnstockFundamentals = fundamentalResult.value
    }
  } catch (error) {
    console.warn('VNStock service không khả dụng:', error)
  }

  // Chuẩn bị dữ liệu cho insights
  let pricesHistory: number[]
  let volumesHistory: number[]
  let priceHistoryWithHighLow: Array<{ high: number | null; low: number | null; close: number | null; volume: number | null }> = []

  if (vnstockPriceHistory && vnstockPriceHistory.length > 0) {
    pricesHistory = vnstockPriceHistory
      .map((record) => record.close)
      .filter((price): price is number => price !== null && price !== undefined)
    volumesHistory = vnstockPriceHistory
      .map((record) => record.volume)
      .filter((vol): vol is number => vol !== null && vol !== undefined)
    // Prepare price history with high/low for price zones analysis
    priceHistoryWithHighLow = vnstockPriceHistory.map((record) => ({
      high: record.high,
      low: record.low,
      close: record.close,
      volume: record.volume,
    }))
  } else {
    pricesHistory = mockPriceHistoryFromCurrentPrice(stock.price)
    volumesHistory = Array.from({ length: pricesHistory.length }, () =>
      Math.floor(Math.random() * 1000000 + 500000)
    )
    // Create mock data with high/low
    priceHistoryWithHighLow = pricesHistory.map((close, index) => {
      const volatility = close * 0.02 // 2% volatility
      return {
        high: close + volatility * (0.5 + Math.random() * 0.5),
        low: close - volatility * (0.5 + Math.random() * 0.5),
        close: close,
        volume: volumesHistory?.[index] || null,
      }
    })
  }

  // Evaluate Short-Term Analysis (new engine)
  const shortTermAnalysis = vnstockPriceHistory && vnstockPriceHistory.length > 0
    ? evaluateShortTermFromVnstock(vnstockPriceHistory)
    : evaluateShortTermFromArrays(pricesHistory, volumesHistory)

  // Extract additional fundamental ratios from vnstock
  const extractedRatios = vnstockFundamentals
    ? extractFundamentalRatios(vnstockFundamentals, stock.price)
    : {}

  // Calculate PEG if we have P/E and growth rate
  let peg: number | undefined
  if (stock.eps > 0 && stock.growth_rate > 0) {
    const priceInVND = stock.price * 1000
    const pe = priceInVND / stock.eps
    peg = pe / stock.growth_rate
  }

  // Evaluate stock insights (keep for backward compatibility, but will use ShortTermAnalysis internally)
  const insights = evaluateStockInsights({
    price: stock.price,
    eps: stock.eps,
    growthRate: stock.growth_rate,
    roe: stock.roe,
    pricesHistory,
    volumesHistory,
    epsGrowth3Y: extractedRatios.epsGrowth3Y,
    revenueGrowth3Y: extractedRatios.revenueGrowth3Y,
    debtToEquity: extractedRatios.debtToEquity,
    pb: extractedRatios.pb,
    roa: extractedRatios.roa,
    currentRatio: extractedRatios.currentRatio,
    quickRatio: extractedRatios.quickRatio,
    profitMargin: extractedRatios.profitMargin,
    operatingMargin: extractedRatios.operatingMargin,
    revenueGrowth: extractedRatios.revenueGrowth,
    epsGrowth: extractedRatios.epsGrowth,
    peg,
  })

  // Evaluate AI Insight for beginners (will use ShortTermAnalysis if available)
  const aiInsight = evaluateAiInsight({
    currentPrice: stock.price,
    trend: insights.trend,
    risk: insights.risk,
    volumesHistory: volumesHistory,
    shortTermAnalysis, // Pass short-term analysis for internal use
  })

  // Evaluate Safe Buy Zone (will use ShortTermAnalysis if available)
  const safeBuyZone = evaluateSafeBuyZone({
    currentPrice: stock.price,
    pricesHistory: pricesHistory,
    volumesHistory: volumesHistory,
    ma20: insights.trend.ma20,
    shortTermAnalysis, // Pass short-term analysis for internal use
  })

  // Evaluate Price Zones (will use ShortTermAnalysis if available)
  const priceZones = evaluatePriceZones({
    currentPrice: stock.price,
    priceHistory: priceHistoryWithHighLow,
    volumesHistory: volumesHistory,
    ma20: insights.trend.ma20,
    ma50: insights.trend.ma50,
    shortTermAnalysis, // Pass short-term analysis for internal use
  })

  // Build Combined Summary
  const combinedSummary = buildCombinedSummary(aiInsight, safeBuyZone, priceZones, insights.trend)

  // Build Hybrid Insight
  const hybridInsight = buildHybridInsight(
    shortTermAnalysis,
    insights,
    aiInsight.conclusion,
    [aiInsight.suggestion, ...aiInsight.reasons.slice(0, 2)],
    aiInsight.knowledge
  )

  const valuation = insights.valuation
  const discountPercent = Math.abs(valuation.discount * 100).toFixed(2)

  // Extract company info from vnstock overview
  const companyOverview = vnstockFundamentals?.overview?.[0] || null
  const companyName = companyOverview?.Tên_công_ty || companyOverview?.ten_cong_ty || companyOverview?.name || stock.name
  const companySector = companyOverview?.icb_name3 || companyOverview?.icb_name4 || companyOverview?.Ngành || companyOverview?.nganh || stock.sector || 'N/A'
  const listingDate = companyOverview?.Ngày_niêm_yết || companyOverview?.ngay_niem_yet || companyOverview?.listing_date || null
  const marketCap = companyOverview?.Vốn_hóa_thị_trường || companyOverview?.von_hoa_thi_truong || companyOverview?.market_cap || null

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors duration-200 mb-8 group"
        >
          <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Quay lại danh sách</span>
        </Link>

        {/* ============================================
            [1] HERO SECTION - ENHANCED WITH COMPANY INFO
            ============================================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Left: Symbol + Name + Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">{stock.symbol}</h1>
                {companyOverview && (() => {
                  const profileText = companyOverview.company_profile || companyOverview.history || ''
                  const exchange = profileText.includes('HOSE') || profileText.includes('Sở Giao dịch Chứng khoán Thành phố Hồ Chí Minh') ? 'HOSE' : 
                                  profileText.includes('HNX') || profileText.includes('Sở Giao dịch Chứng khoán Hà Nội') ? 'HNX' : 
                                  profileText.includes('UPCOM') || profileText.includes('UPCoM') ? 'UPCOM' : null
                  return exchange ? (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                      {exchange}
                    </span>
                  ) : null
                })()}
              </div>
              
              {/* Tên công ty ngắn */}
              <p className="text-lg md:text-xl text-gray-700 mb-2 font-medium">{companyName}</p>
              
              {/* Tên doanh nghiệp đầy đủ từ company_profile */}
              {companyOverview?.company_profile && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {companyOverview.company_profile.split('(')[0].trim()}
                </p>
              )}
              
              {/* Thông tin bổ sung */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{companySector}</span>
                </div>
                {companyOverview?.charter_capital && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Vốn điều lệ: {(companyOverview.charter_capital / 1000000000).toFixed(2)} tỷ VND</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Price + Discount Badge */}
            <div className="text-left md:text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Giá hiện tại</div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {(stock.price * 1000).toLocaleString('vi-VN')} <span className="text-lg text-gray-500 font-normal">VND</span>
              </div>
              {valuation.discount !== 0 && (
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    valuation.discount > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {valuation.discount > 0 ? 'Rẻ hơn' : 'Đắt hơn'} {Math.abs(valuation.discount * 100).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================
            [2] CHART
            ============================================ */}
        <section className="mb-8">
          <PriceChart
            symbol={stock.symbol}
            currentPrice={stock.price}
            priceHistory={vnstockPriceHistory || null}
          />
        </section>

        {/* ============================================
            [3] NHẬN ĐỊNH TỔNG QUAN (HYBRID INSIGHT)
            ============================================ */}
        <HybridInsightCard 
          data={hybridInsight} 
          valuation={valuation}
          insights={insights}
          stock={stock}
        />


        {/* ============================================
            [4] LỊCH SỬ GIÁ
            ============================================ */}
        {vnstockPriceHistory && vnstockPriceHistory.length > 0 ? (
          <PriceHistoryTable
            priceHistory={vnstockPriceHistory.map((record) => ({
              date: record.date,
              open: record.open,
              close: record.close,
              high: record.high,
              low: record.low,
              volume: record.volume,
            }))}
            itemsPerPage={20}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center mb-6 md:mb-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <p className="text-gray-600">Chưa có dữ liệu lịch sử giá</p>
          </div>
        )}

        {/* ============================================
            [5] THÔNG TIN DOANH NGHIỆP (MỞ RỘNG)
            ============================================ */}
        {companyOverview && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 mb-6 md:mb-8 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-8 tracking-tight">Thông tin doanh nghiệp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Mã cổ phiếu</dt>
                    <dd className="text-sm font-medium text-gray-900">{stock.symbol}</dd>
                  </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Tên công ty</dt>
            <dd className="text-sm font-medium text-gray-900">{companyName}</dd>
          </div>
          {companyOverview.company_profile && (
            <div className="flex justify-between items-start">
              <dt className="text-sm text-gray-600">Tên doanh nghiệp đầy đủ</dt>
              <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">
                {companyOverview.company_profile.split('(')[0].trim() || companyName}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Ngành</dt>
            <dd className="text-sm font-medium text-gray-900">{companySector}</dd>
          </div>
                  {listingDate && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Ngày niêm yết</dt>
                      <dd className="text-sm font-medium text-gray-900">{listingDate}</dd>
                    </div>
                  )}
          {marketCap && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Vốn hóa thị trường</dt>
              <dd className="text-sm font-medium text-gray-900">
                {typeof marketCap === 'number'
                  ? (marketCap / 1000000000).toFixed(2) + ' tỷ VND'
                  : marketCap}
              </dd>
            </div>
          )}
          {companyOverview.charter_capital && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Vốn điều lệ</dt>
              <dd className="text-sm font-medium text-gray-900">
                {typeof companyOverview.charter_capital === 'number'
                  ? (companyOverview.charter_capital / 1000000000).toFixed(2) + ' tỷ VND'
                  : companyOverview.charter_capital}
              </dd>
            </div>
          )}
          {companyOverview.issue_share && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Số lượng cổ phiếu</dt>
              <dd className="text-sm font-medium text-gray-900">
                {typeof companyOverview.issue_share === 'number'
                  ? (companyOverview.issue_share / 1000000).toFixed(2) + ' triệu CP'
                  : companyOverview.issue_share}
              </dd>
            </div>
          )}
          {(() => {
            // Parse sàn giao dịch từ company_profile hoặc history
            const profileText = companyOverview.company_profile || companyOverview.history || ''
            let exchange = null
            if (profileText.includes('HOSE') || profileText.includes('Sở Giao dịch Chứng khoán Thành phố Hồ Chí Minh')) {
              exchange = 'HOSE'
            } else if (profileText.includes('HNX') || profileText.includes('Sở Giao dịch Chứng khoán Hà Nội')) {
              exchange = 'HNX'
            } else if (profileText.includes('UPCOM') || profileText.includes('UPCoM')) {
              exchange = 'UPCOM'
            }
            return exchange ? (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Sàn giao dịch</dt>
                <dd className="text-sm font-medium text-gray-900">{exchange}</dd>
              </div>
            ) : null
          })()}
          {companyOverview.Địa_chỉ && (
                    <div className="flex justify-between items-start">
                      <dt className="text-sm text-gray-600">Địa chỉ</dt>
                      <dd className="text-sm font-medium text-gray-900 text-right max-w-xs">{companyOverview.Địa_chỉ}</dd>
                    </div>
                  )}
                  {companyOverview.Điện_thoại && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Điện thoại</dt>
                      <dd className="text-sm font-medium text-gray-900">{companyOverview.Điện_thoại}</dd>
                    </div>
                  )}
                  {companyOverview.Email && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Email</dt>
                      <dd className="text-sm font-medium text-gray-900">{companyOverview.Email}</dd>
                    </div>
                  )}
                  {companyOverview.Website && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Website</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        <a 
                          href={String(companyOverview.Website).startsWith('http') ? String(companyOverview.Website) : `https://${companyOverview.Website}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {companyOverview.Website}
                        </a>
                      </dd>
                    </div>
                  )}
                  {companyOverview.Mã_số_thuế && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Mã số thuế</dt>
                      <dd className="text-sm font-medium text-gray-900">{companyOverview.Mã_số_thuế}</dd>
                    </div>
                  )}
                  {companyOverview.Ngày_thành_lập && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Ngày thành lập</dt>
                      <dd className="text-sm font-medium text-gray-900">{companyOverview.Ngày_thành_lập}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Chỉ số tài chính</h3>
                {vnstockFundamentals?.ratios && vnstockFundamentals.ratios.length > 0 && (
                  <div className="space-y-2">
                    {(() => {
                      // Tìm năm gần nhất
                      const years = vnstockFundamentals.ratios.map((r: any) => {
                        const year = r['Meta_Năm'] || r['Năm'] || 0
                        return typeof year === 'number' ? year : parseInt(String(year)) || 0
                      })
                      const latestYear = Math.max(...years)
                      const latestRatio = vnstockFundamentals.ratios.find((r: any) => {
                        const year = r['Meta_Năm'] || r['Năm'] || 0
                        const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
                        return yearNum === latestYear
                      }) || vnstockFundamentals.ratios[0]

                      const roe = latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] || latestRatio?.ROE
                      const eps = latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] || latestRatio?.EPS
                      const pe = latestRatio?.['Chỉ tiêu định giá_P/E'] || latestRatio?.P_E

                      return (
                        <>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Năm báo cáo</dt>
                            <dd className="text-sm font-medium text-gray-900">{latestYear}</dd>
                          </div>
                          {roe !== undefined && roe !== null && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">ROE</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {typeof roe === 'number' ? roe.toFixed(2) : roe}%
                              </dd>
                            </div>
                          )}
                          {eps !== undefined && eps !== null && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">EPS</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {typeof eps === 'number' ? eps.toLocaleString('vi-VN') : eps} VND
                              </dd>
                            </div>
                          )}
                          {pe !== undefined && pe !== null && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">P/E</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {typeof pe === 'number' ? pe.toFixed(2) : pe}
                              </dd>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================
            [9] NGUỒN DỮ LIỆU
            ============================================ */}
        <section className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Dữ liệu từ vnstock</span>
            {vnstockPriceHistory && vnstockPriceHistory.length > 0 && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                Đã cập nhật
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
