/**
 * VNStock Service Client
 * 
 * Client để gọi VNStock Python service (FastAPI)
 * Service chạy tại: http://localhost:8000 (hoặc config qua env)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_VNSTOCK_SERVICE_URL || 'http://localhost:8000'

export interface VnstockPriceRecord {
  date: string
  open: number | null
  close: number | null
  high: number | null
  low: number | null
  volume: number | null
}

export interface VnstockFundamentalResponse {
  overview: Array<Record<string, any>>
  ratios: Array<Record<string, any>>
}

export interface IndexQuote {
  symbol: string
  current_value: number
  change: number
  change_percent: number
  volume: number
  updated_at: string
}

/**
 * Lấy lịch sử giá cổ phiếu từ vnstock service
 */
export async function fetchVnstockPriceHistory(
  symbol: string,
  params?: {
    start?: string
    end?: string
  }
): Promise<VnstockPriceRecord[]> {
  const search = new URLSearchParams({
    start: params?.start ?? '2024-01-01',
    end: params?.end ?? '',
  })

  const res = await fetch(
    `${BASE_URL}/api/stock/${symbol.toUpperCase()}/price-history?${search.toString()}`,
    {
      next: { revalidate: 60 }, // Cache 60 giây
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(
      `Failed to fetch price history for ${symbol}: ${res.status} ${errorText}`
    )
  }

  return res.json()
}

/**
 * Lấy thông tin cơ bản và chỉ số tài chính từ vnstock service
 */
export async function fetchVnstockFundamentals(
  symbol: string
): Promise<VnstockFundamentalResponse> {
  const res = await fetch(
    `${BASE_URL}/api/stock/${symbol.toUpperCase()}/fundamentals`,
    {
      next: { revalidate: 3600 }, // Cache 1 giờ
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(
      `Failed to fetch fundamentals for ${symbol}: ${res.status} ${errorText}`
    )
  }

  return res.json()
}

/**
 * Lấy thông tin chỉ số thị trường từ vnstock service
 */
export async function fetchIndexQuote(indexSymbol: string): Promise<IndexQuote | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/index/${indexSymbol}/quote`,
      {
        next: { revalidate: 60 }, // Cache 60 giây
      }
    )
    
    if (!res.ok) {
      console.warn(`Failed to fetch index quote for ${indexSymbol}: ${res.statusText}`)
      return null
    }
    
    return res.json()
  } catch (error) {
    console.warn(`Error fetching index quote for ${indexSymbol}:`, error)
    return null
  }
}


