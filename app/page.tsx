import { prisma } from '@/lib/prisma'
import { calculateValuation } from '@/lib/valuation'
import StockList from './components/StockList'
import MarketIndices from './components/MarketIndices'
import { fetchIndexQuote } from '@/lib/vnstockClient'

export default async function HomePage() {
  // Load tất cả mã cổ phiếu từ database
  const stocks = await prisma.stock.findMany({
    orderBy: { symbol: 'asc' },
  })

  const stocksWithValuation = stocks.map((stock) => ({
    ...stock,
    valuation: calculateValuation(stock),
  }))

  // Fetch index data
  let indexData = {}
  try {
    const [vnindex, vn30, hnx, upcom] = await Promise.allSettled([
      fetchIndexQuote('VNINDEX'),
      fetchIndexQuote('VN30'),
      fetchIndexQuote('HNX'),
      fetchIndexQuote('UPCOM'),
    ])
    
    indexData = {
      vnindex: vnindex.status === 'fulfilled' ? vnindex.value : null,
      vn30: vn30.status === 'fulfilled' ? vn30.value : null,
      hnx: hnx.status === 'fulfilled' ? hnx.value : null,
      upcom: upcom.status === 'fulfilled' ? upcom.value : null,
    }
  } catch (error) {
    console.warn('Failed to fetch index data:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {stocks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có dữ liệu cổ phiếu trong Database
              </h3>
              <p className="text-gray-600 mb-6">
                Hãy chạy script import để thêm dữ liệu cổ phiếu vào database.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Cách chạy script import:
                </p>
                <code className="block text-xs bg-white p-3 rounded border border-gray-200">
                  npm run import:vnstock
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Đảm bảo service đang chạy tại http://localhost:8000
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Market Indices */}
            <MarketIndices initialData={indexData} />

            {/* Stock List */}
            <StockList stocks={stocksWithValuation} />
          </>
        )}
      </div>
    </div>
  )
}

