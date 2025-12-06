'use client'

import { useState } from 'react'
import { importStocksFromVnstock } from './importActions'

export default function ImportButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    results?: Array<{ symbol: string; success: boolean; message: string }>
  } | null>(null)

  const handleImport = async () => {
    if (!confirm('Bạn có chắc muốn import dữ liệu cổ phiếu từ vnstock? Quá trình này có thể mất vài phút.')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await importStocksFromVnstock()
      setResult(response)
    } catch (error: any) {
      setResult({
        success: false,
        message: `Lỗi: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleImport}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang import...
          </span>
        ) : (
          '📥 Import dữ liệu từ VNStock'
        )}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`font-semibold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {result.message}
          </p>
          {result.results && result.results.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-2">Chi tiết:</p>
              <ul className="text-sm space-y-1">
                {result.results.slice(0, 20).map((r, idx) => (
                  <li
                    key={idx}
                    className={r.success ? 'text-green-700' : 'text-red-700'}
                  >
                    {r.success ? '✅' : '❌'} {r.symbol}: {r.message}
                  </li>
                ))}
                {result.results.length > 20 && (
                  <li className="text-gray-500">
                    ... và {result.results.length - 20} mã khác
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

