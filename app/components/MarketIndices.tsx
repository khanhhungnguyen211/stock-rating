'use client'

import { useEffect, useState } from 'react'
import type { IndexQuote } from '@/lib/vnstockClient'
import { fetchIndexQuote } from '@/lib/vnstockClient'

interface MarketIndicesProps {
  initialData?: {
    vnindex?: IndexQuote | null
    vn30?: IndexQuote | null
    hnx?: IndexQuote | null
    upcom?: IndexQuote | null
  }
}

export default function MarketIndices({ initialData }: MarketIndicesProps) {
  const [indices, setIndices] = useState(initialData || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch ngay lập tức khi component mount
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [vnindex, vn30, hnx, upcom] = await Promise.all([
          fetchIndexQuote('VNINDEX'),
          fetchIndexQuote('VN30'),
          fetchIndexQuote('HNX'),
          fetchIndexQuote('UPCOM'),
        ])
        setIndices({ vnindex, vn30, hnx, upcom })
        
        // Log nếu có lỗi
        if (!vnindex && !vn30 && !hnx && !upcom) {
          setError('Không thể tải dữ liệu chỉ số. Vui lòng kiểm tra vnstock service.')
        }
      } catch (err) {
        console.error('Error fetching indices:', err)
        setError('Lỗi khi tải dữ liệu chỉ số thị trường')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh mỗi 60 giây
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const IndexCard = ({ 
    label, 
    data, 
    symbol 
  }: { 
    label: string
    data: IndexQuote | null | undefined
    symbol: string
  }) => {
    if (!data) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">{label}</div>
          <div className="text-lg text-gray-400">Đang tải...</div>
        </div>
      )
    }

    const isPositive = data.change >= 0
    const changeColor = isPositive ? 'text-emerald-600' : 'text-rose-600'
    const bgColor = isPositive ? 'bg-emerald-50' : 'bg-rose-50'

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex-1">
            <div className="text-xs md:text-sm font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">
              {data.current_value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-blue-600"></div>
          )}
        </div>
        <div className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold ${bgColor} ${changeColor}`}>
          <span className="mr-1">{isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(data.change).toFixed(2)}</span>
          <span className="ml-1 md:ml-2">
            ({isPositive ? '+' : ''}{data.change_percent.toFixed(2)}%)
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 tracking-tight">Thị trường hôm nay</h2>
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <IndexCard label="VN-Index" data={indices.vnindex} symbol="VNINDEX" />
        <IndexCard label="VN30" data={indices.vn30} symbol="VN30" />
        <IndexCard label="HNX-Index" data={indices.hnx} symbol="HNX" />
        <IndexCard label="UPCOM-Index" data={indices.upcom} symbol="UPCOM" />
      </div>
    </div>
  )
}

