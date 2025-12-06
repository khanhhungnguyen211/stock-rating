'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

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

interface StockListProps {
  stocks: Stock[]
}

export default function StockList({ stocks }: StockListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'pe' | 'score' | 'discount'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'Rẻ' | 'Hợp lý' | 'Đắt'>('all')
  const [quickFilter, setQuickFilter] = useState<'all' | 'top_gainers' | 'best_value' | 'high_risk'>('all')

  // Filter và sort
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stocks]

    // Quick filters
    if (quickFilter === 'top_gainers') {
      result = result.filter((stock) => stock.valuation.score >= 70).sort((a, b) => b.valuation.score - a.valuation.score)
    } else if (quickFilter === 'best_value') {
      result = result.filter((stock) => stock.valuation.status_tag === 'Rẻ').sort((a, b) => b.valuation.discount - a.valuation.discount)
    } else if (quickFilter === 'high_risk') {
      result = result.filter((stock) => stock.valuation.score < 30).sort((a, b) => a.valuation.score - b.valuation.score)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(term) ||
          stock.name.toLowerCase().includes(term) ||
          stock.sector.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((stock) => stock.valuation.status_tag === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case 'symbol':
          aValue = a.symbol
          bValue = b.symbol
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'pe':
          aValue = a.pe
          bValue = b.pe
          break
        case 'score':
          aValue = a.valuation.score
          bValue = b.valuation.score
          break
        case 'discount':
          aValue = a.valuation.discount
          bValue = b.valuation.discount
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    return result
  }, [stocks, searchTerm, filterStatus, sortBy, sortOrder, quickFilter])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rẻ':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Hợp lý':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Đắt':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-gradient-to-r from-emerald-500 to-emerald-600'
    if (score >= 50) return 'bg-gradient-to-r from-amber-500 to-amber-600'
    return 'bg-gradient-to-r from-rose-500 to-rose-600'
  }

  const getDiscountColor = (discount: number) => {
    // discount > 0: giá rẻ hơn fair value (tốt) → màu xanh
    // discount < 0: giá đắt hơn fair value (xấu) → màu đỏ
    // discount = 0: giá bằng fair value → màu xám
    if (discount > 0) return 'text-emerald-600 font-semibold'  // Xanh cho discount dương
    if (discount < 0) return 'text-rose-600 font-semibold'      // Đỏ cho discount âm
    return 'text-gray-600'  // Màu xám cho discount = 0
  }

  const formatDiscount = (discount: number) => {
    // discount = (fair_value - price) / fair_value
    // discount > 0: giá rẻ hơn fair value (giá tốt) → hiển thị dương
    // discount < 0: giá đắt hơn fair value (giá cao) → hiển thị âm
    const percent = Math.abs(discount * 100)
    
    // Giới hạn hiển thị tối đa 200% để tránh số quá lớn
    const displayPercent = Math.min(200, percent)
    
    if (discount > 0) {
      return `${displayPercent.toFixed(1)}%` // Rẻ hơn fair value X%
    } else if (discount < 0) {
      return `+${displayPercent.toFixed(1)}%` // Đắt hơn fair value X%
    }
    return '0%'
  }

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <span className="text-gray-400">↕</span>
    return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">Cơ hội đầu tư</h2>
      
      {/* Search & Filters - Compact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {/* Row 1: Search + Filter Dropdown + Results Count */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã, tên công ty, ngành..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">Tất cả định giá</option>
              <option value="Rẻ">Rẻ</option>
              <option value="Hợp lý">Hợp lý</option>
              <option value="Đắt">Đắt</option>
            </select>
          </div>

          {/* Results count */}
          <div className="md:w-32 flex items-center justify-end">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredAndSortedStocks.length}</span> / {stocks.length}
            </span>
          </div>
        </div>

        {/* Row 2: Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              quickFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setQuickFilter('top_gainers')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              quickFilter === 'top_gainers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⭐ Cơ hội đầu tư
          </button>
          <button
            onClick={() => setQuickFilter('best_value')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              quickFilter === 'best_value'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💰 Định giá hấp dẫn
          </button>
          <button
            onClick={() => setQuickFilter('high_risk')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              quickFilter === 'high_risk'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚠️ Rủi ro cao
          </button>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50 sticky top-0 z-10 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort('symbol')
                  }}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Mã
                    <SortIcon field="symbol" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Tên doanh nghiệp
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Ngành nghề
                </th>
                <th
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort('price')
                  }}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-2">
                    Giá hiện tại
                    <SortIcon field="price" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  P/E
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Giá trị hợp lý
                </th>
                <th
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort('discount')
                  }}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-2">
                    Chênh lệch giá
                    <SortIcon field="discount" />
                  </div>
                </th>
                <th
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort('score')
                  }}
                  className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      Điểm đánh giá
                      <span
                        className="text-gray-400 cursor-help relative group"
                        title="Điểm từ 1-100: Càng cao càng hấp dẫn. Dựa trên chênh lệch giữa giá hiện tại và giá trị ước tính"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <SortIcon field="score" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Định giá
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="text-4xl mb-4">🔍</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Không tìm thấy kết quả
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {searchTerm
                          ? `Không có mã nào khớp với "${searchTerm}"`
                          : `Không có mã nào ở trạng thái "${filterStatus === 'all' ? 'tất cả' : filterStatus}"`}
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setFilterStatus('all')
                          setQuickFilter('all')
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Xóa bộ lọc →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedStocks.map((stock, index) => (
                  <tr
                    key={stock.id}
                    onClick={() => router.push(`/stocks/${stock.symbol}`)}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-all duration-200 border-b border-gray-100 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        {stock.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={stock.name}>
                        {stock.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {stock.sector && stock.sector !== 'N/A' ? stock.sector : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {(stock.price * 1000).toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-500">VND</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-700">
                        {stock.pe.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-700">
                        {stock.valuation.fair_value.toLocaleString('vi-VN', {
                          maximumFractionDigits: 0,
                        })}{' '}
                        <span className="text-xs font-normal text-gray-500">VND</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${getDiscountColor(stock.valuation.discount)}`}>
                        {formatDiscount(stock.valuation.discount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-14 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm ${getScoreColor(
                          stock.valuation.score
                        )}`}
                      >
                        {Math.round(stock.valuation.score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${getStatusColor(
                          stock.valuation.status_tag
                        )}`}
                      >
                        {stock.valuation.status_tag}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedStocks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchTerm
                ? `Không có mã nào khớp với "${searchTerm}"`
                : `Không có mã nào ở trạng thái "${filterStatus === 'all' ? 'tất cả' : filterStatus}"`}
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setQuickFilter('all')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Xóa bộ lọc →
            </button>
          </div>
        ) : (
          filteredAndSortedStocks.map((stock) => (
            <div
              key={stock.id}
              onClick={() => router.push(`/stocks/${stock.symbol}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-blue-600">{stock.symbol}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border-2 ${getStatusColor(
                        stock.valuation.status_tag
                      )}`}
                    >
                      {stock.valuation.status_tag}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                    {stock.name}
                  </p>
                  {stock.sector && stock.sector !== 'N/A' && (
                    <p className="text-xs text-gray-500">{stock.sector}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold text-white shadow-sm ${getScoreColor(
                    stock.valuation.score
                  )}`}
                >
                  {Math.round(stock.valuation.score)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Giá hiện tại</p>
                  <p className="text-sm font-bold text-gray-900">
                    {(stock.price * 1000).toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-500">VND</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">P/E</p>
                  <p className="text-sm font-semibold text-gray-700">{stock.pe.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Giá trị hợp lý</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {stock.valuation.fair_value.toLocaleString('vi-VN', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    <span className="text-xs font-normal text-gray-500">VND</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Chênh lệch</p>
                  <p className={`text-sm font-bold ${getDiscountColor(stock.valuation.discount)}`}>
                    {formatDiscount(stock.valuation.discount)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

