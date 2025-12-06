'use client'

import { useState, useMemo } from 'react'

interface PriceRecord {
  date: string
  open: number | null
  close: number | null
  high: number | null
  low: number | null
  volume: number | null
}

interface PriceHistoryTableProps {
  priceHistory: PriceRecord[]
  itemsPerPage?: number
}

export default function PriceHistoryTable({
  priceHistory,
  itemsPerPage = 20,
}: PriceHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Sắp xếp theo ngày mới nhất trước
  const sortedHistory = useMemo(() => {
    return [...priceHistory].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [priceHistory])

  // Tính toán phân trang
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = sortedHistory.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (priceHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Chưa có dữ liệu lịch sử giá</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          Lịch sử giá ({priceHistory.length} phiên)
        </h3>
        <div className="text-sm text-gray-500 font-medium">
          Trang {currentPage} / {totalPages}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mở cửa
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Đóng cửa
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Cao nhất
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thấp nhất
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Khối lượng
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thay đổi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentData.map((record, idx) => {
              const prevRecord = idx > 0 ? currentData[idx - 1] : null
              const change =
                prevRecord && record.close && prevRecord.close
                  ? ((record.close - prevRecord.close) / prevRecord.close) * 100
                  : null

              return (
                <tr key={record.date} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {record.date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {record.open !== null && record.open !== undefined
                      ? `${record.open.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {record.close !== null && record.close !== undefined
                      ? `${record.close.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {record.high !== null && record.high !== undefined
                      ? `${record.high.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {record.low !== null && record.low !== undefined
                      ? `${record.low.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {record.volume !== null && record.volume !== undefined
                      ? record.volume.toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-right ${
                      change !== null
                        ? change > 0
                          ? 'text-emerald-600'
                          : change < 0
                          ? 'text-rose-600'
                          : 'text-gray-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {change !== null
                      ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
                      : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, sortedHistory.length)} /{' '}
            {sortedHistory.length} phiên
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                currentPage === 1
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 border-gray-200'
              }`}
            >
              ← Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                currentPage === totalPages
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 border-gray-200'
              }`}
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

