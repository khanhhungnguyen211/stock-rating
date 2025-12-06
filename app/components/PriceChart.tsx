'use client'

interface PriceRecord {
  date: string
  close: number | null
  high?: number | null
  low?: number | null
  open?: number | null
  volume?: number | null
}

interface PriceChartProps {
  symbol: string
  currentPrice: number
  priceHistory?: PriceRecord[] | null
}

export default function PriceChart({
  symbol,
  currentPrice,
  priceHistory,
}: PriceChartProps) {
  // Sử dụng dữ liệu thực nếu có, nếu không thì tạo mock data
  const chartData = (() => {
    if (priceHistory && priceHistory.length > 0) {
      // Sử dụng dữ liệu thực từ vnstock
      return priceHistory
        .filter((record) => record.close !== null && record.close !== undefined)
        .slice(-60) // Lấy 60 phiên gần nhất
        .map((record) => ({
          date: record.date,
          price: record.close!,
        }))
    }

    // Fallback: Tạo dữ liệu giả lập cho 30 ngày gần nhất
    const days = 30
    const data = []
    const basePrice = currentPrice
    const volatility = basePrice * 0.05 // 5% biến động

    for (let i = days - 1; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 2 * volatility
      const price = basePrice + randomChange + (Math.random() - 0.5) * volatility
      data.push({
        date: `Day ${i}`,
        price: Math.max(price, basePrice * 0.7), // Đảm bảo giá không quá thấp
      })
    }

    // Đảm bảo giá cuối cùng là giá hiện tại
    data[data.length - 1].price = currentPrice

    return data
  })()
  const maxPrice = Math.max(...chartData.map((d) => d.price))
  const minPrice = Math.min(...chartData.map((d) => d.price))
  const priceRange = maxPrice - minPrice || 1

  // Tính toán điểm cho SVG path
  const width = 600
  const height = 200
  const padding = 20

  const points = chartData.map((point, index) => {
    const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding)
    const y =
      height -
      padding -
      ((point.price - minPrice) / priceRange) * (height - 2 * padding)
    return { x, y, price: point.price }
  })

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPathData =
    pathData +
    ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${
      height - padding
    } Z`

  // Màu sắc dựa trên xu hướng
  const firstPrice = chartData[0].price
  const lastPrice = chartData[chartData.length - 1].price
  const isUp = lastPrice >= firstPrice
  const lineColor = isUp ? '#10b981' : '#ef4444'
  const areaColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">
        Biểu đồ giá {chartData.length} phiên gần nhất
      </h3>
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (height - 2 * padding)
            const price = maxPrice - ratio * priceRange
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {(price * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPathData} fill={areaColor} />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => {
            if (index % 5 !== 0 && index !== points.length - 1) return null
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={lineColor}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}

          {/* Current price marker */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill={lineColor}
            stroke="white"
            strokeWidth="2"
          />
        </svg>

        {/* Legend */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-0.5 rounded-full"
                style={{ backgroundColor: lineColor }}
              />
              <span className="text-gray-500 font-medium">Giá đóng cửa</span>
            </div>
            <div className="text-gray-400">
              Cao nhất: <span className="text-gray-600 font-medium">{(maxPrice * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</span>
            </div>
            <div className="text-gray-400">
              Thấp nhất: <span className="text-gray-600 font-medium">{(minPrice * 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND</span>
            </div>
          </div>
          <div className="text-gray-900 font-semibold">
            Giá hiện tại: <span className="text-lg">{(currentPrice * 1000).toLocaleString('vi-VN')} VND</span>
          </div>
        </div>
      </div>
    </div>
  )
}


