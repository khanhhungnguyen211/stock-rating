'use client'

interface Stock {
  id: number
  symbol: string
  name: string
  sector: string
  price: number
  eps: number
  pe: number
  valuation: {
    fair_value: number
    score: number
    status_tag: string
    discount: number
  }
}

interface DashboardStatsProps {
  stocks: Stock[]
}

export default function DashboardStats({ stocks }: DashboardStatsProps) {
  // Tính toán statistics
  const totalStocks = stocks.length
  const cheapStocks = stocks.filter((s) => s.valuation.status_tag === 'Rẻ').length
  const fairStocks = stocks.filter((s) => s.valuation.status_tag === 'Hợp lý').length
  const expensiveStocks = stocks.filter((s) => s.valuation.status_tag === 'Đắt').length

  const highScoreStocks = stocks.filter((s) => s.valuation.score >= 70).length
  const avgPE = stocks.reduce((sum, s) => sum + s.pe, 0) / totalStocks || 0
  const avgScore = stocks.reduce((sum, s) => sum + s.valuation.score, 0) / totalStocks || 0

  // Tính tổng vốn hóa ước tính (giả sử mỗi mã có 1 triệu cổ phiếu)
  const totalMarketCap = stocks.reduce((sum, s) => sum + s.price * 1000 * 1000000, 0)

  const stats = [
    {
      label: 'Tổng số mã niêm yết',
      value: totalStocks,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Cơ hội đầu tư (≥70 điểm)',
      value: highScoreStocks,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'emerald',
    },
    {
      label: 'P/E trung bình thị trường',
      value: avgPE.toFixed(1),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'amber',
    },
    {
      label: 'Điểm đánh giá trung bình',
      value: avgScore.toFixed(1),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'purple',
    },
  ]

  const statusDistribution = [
    { label: 'Rẻ', count: cheapStocks, color: 'emerald', percent: ((cheapStocks / totalStocks) * 100).toFixed(1) },
    { label: 'Hợp lý', count: fairStocks, color: 'amber', percent: ((fairStocks / totalStocks) * 100).toFixed(1) },
    { label: 'Đắt', count: expensiveStocks, color: 'rose', percent: ((expensiveStocks / totalStocks) * 100).toFixed(1) },
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-50 text-blue-600'
                    : stat.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : stat.color === 'amber'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-purple-50 text-purple-600'
                }`}
              >
                {stat.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{stat.value}</div>
            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ định giá</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusDistribution.map((status, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{status.label}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {status.count} ({status.percent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    status.color === 'emerald'
                      ? 'bg-emerald-500'
                      : status.color === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${status.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

