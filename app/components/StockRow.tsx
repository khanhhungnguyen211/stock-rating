'use client'

import { useRouter } from 'next/navigation'

interface StockRowProps {
  stock: {
    id: number
    symbol: string
    name: string
    sector: string
    price: number
    valuation: {
      fair_value: number
      score: number
      status_tag: string
    }
  }
  index: number
}

export default function StockRow({ stock, index }: StockRowProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/stocks/${stock.symbol}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rẻ':
        return 'bg-green-100 text-green-800'
      case 'Hợp lý':
        return 'bg-gray-100 text-gray-800'
      case 'Đắt':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <tr
      onClick={handleClick}
      className={`hover:bg-gray-50 cursor-pointer transition ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-blue-600">
          {stock.symbol}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{stock.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{stock.sector}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {stock.price.toLocaleString('vi-VN')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {stock.valuation.fair_value.toLocaleString('vi-VN', {
            maximumFractionDigits: 0,
          })}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getScoreColor(
            stock.valuation.score
          )}`}
        >
          {Math.round(stock.valuation.score)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            stock.valuation.status_tag
          )}`}
        >
          {stock.valuation.status_tag}
        </span>
      </td>
    </tr>
  )
}

