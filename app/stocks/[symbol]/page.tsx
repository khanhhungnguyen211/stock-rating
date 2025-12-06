import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { evaluateStockInsights, mockPriceHistoryFromCurrentPrice } from '@/lib/stockInsights'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
  type VnstockPriceRecord,
  type VnstockFundamentalResponse,
} from '@/lib/vnstockClient'
import PriceChart from '@/app/components/PriceChart'
import PriceHistoryTable from '@/app/components/PriceHistoryTable'
import OverviewSection from './OverviewSection'

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

  if (vnstockPriceHistory && vnstockPriceHistory.length > 0) {
    pricesHistory = vnstockPriceHistory
      .map((record) => record.close)
      .filter((price): price is number => price !== null && price !== undefined)
    volumesHistory = vnstockPriceHistory
      .map((record) => record.volume)
      .filter((vol): vol is number => vol !== null && vol !== undefined)
  } else {
    pricesHistory = mockPriceHistoryFromCurrentPrice(stock.price)
    volumesHistory = Array.from({ length: pricesHistory.length }, () =>
      Math.floor(Math.random() * 1000000 + 500000)
    )
  }

  // Evaluate stock insights
  const insights = evaluateStockInsights({
    price: stock.price,
    eps: stock.eps,
    growthRate: stock.growth_rate,
    roe: stock.roe,
    pricesHistory,
    volumesHistory,
  })

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
            [1] HEADER CÔNG TY (CẢI TIẾN)
            ============================================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 mb-6 md:mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            {/* Left: Company Info + Metrics */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-3 tracking-tight">{stock.symbol}</h1>
              <p className="text-base md:text-xl text-gray-700 mb-3 md:mb-4 font-medium">{companyName}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {companySector}
                </span>
                {listingDate && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Niêm yết: {listingDate}
                  </span>
                )}
              </div>
              
              {/* Stock Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">EPS</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {stock.eps.toLocaleString('vi-VN')} <span className="text-xs text-gray-500">VND</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">P/E</div>
                  <div className="text-sm font-semibold text-gray-900">{stock.pe.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">ROE</div>
                  <div className="text-sm font-semibold text-gray-900">{stock.roe.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tăng trưởng</div>
                  <div className={`text-sm font-semibold ${stock.growth_rate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stock.growth_rate >= 0 ? '+' : ''}{stock.growth_rate.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Price + Valuation */}
            <div className="text-left md:text-right mt-4 md:mt-0 md:ml-6">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 md:mb-3 font-medium">Giá hiện tại</div>
              <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-3 tracking-tight">
                {(stock.price * 1000).toLocaleString('vi-VN')} <span className="text-xl md:text-2xl text-gray-500 font-normal">VND</span>
              </div>
              {marketCap && (
                <div className="text-xs text-gray-500 mb-3">
                  Vốn hóa: {typeof marketCap === 'number' 
                    ? (marketCap / 1000000000).toFixed(2) + ' tỷ VND'
                    : marketCap}
                </div>
              )}
              <div className="flex items-center justify-start md:justify-end gap-2">
                <div
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    valuation.discount > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : valuation.discount < 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  {valuation.discount > 0 ? 'Rẻ hơn' : valuation.discount < 0 ? 'Đắt hơn' : 'Hợp lý'}{' '}
                  {discountPercent}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            [2] CHART (NGAY ĐÂY - ƯU TIÊN CAO)
            ============================================ */}
        <section className="mb-8">
          <PriceChart
            symbol={stock.symbol}
            currentPrice={stock.price}
            priceHistory={vnstockPriceHistory || null}
          />
        </section>

        {/* ============================================
            [3] NHẬN ĐỊNH TỔNG QUAN (NỔI BẬT)
            ============================================ */}
        <OverviewSection valuation={valuation} insights={insights} stock={stock} />

        {/* ============================================
            [4] LỊCH SỬ GIÁ
            ============================================ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 mb-6 md:mb-8 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">Lịch sử giá</h2>
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
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-600">Chưa có dữ liệu lịch sử giá</p>
            </div>
          )}
        </section>

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
