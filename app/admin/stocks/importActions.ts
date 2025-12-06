'use server'

import { prisma } from '@/lib/prisma'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
} from '@/lib/vnstockClient'
import { revalidatePath } from 'next/cache'

/**
 * Danh sách mã cổ phiếu phổ biến
 */
const POPULAR_SYMBOLS = [
  'VCB', 'VIC', 'VHM', 'VRE', 'VNM', 'MSN', 'HPG', 'MWG', 'FPT', 'TCB',
  'BID', 'CTG', 'MBB', 'VPB', 'SSI', 'VJC', 'GAS', 'PLX', 'POW', 'VSH',
  'VGC', 'VHC', 'VND', 'VCI', 'VSC', 'VTO', 'VTS', 'ACB', 'SHB', 'VCS',
  'BSI', 'HDB', 'LPB', 'NVB', 'OCB', 'TPB', 'DGC', 'DXG', 'DXS', 'EVE',
  'FCM', 'FRT', 'GMD', 'HCM', 'HNG', 'HQC', 'HSG', 'HVN', 'IDV', 'KBC',
  'KDC', 'KDH', 'KOS', 'MSH', 'NVL', 'PDR', 'PNJ', 'QCG', 'REE', 'ROS',
  'SAB', 'SBT', 'SSB', 'STB', 'TCH', 'TNG',
]

interface StockData {
  symbol: string
  name: string
  sector: string
  price: number
  eps: number
  pe: number
  roe: number
  growth_rate: number
}

function getCurrentPrice(priceHistory: any[]): number | null {
  if (!priceHistory || priceHistory.length === 0) return null
  const latest = priceHistory[priceHistory.length - 1]
  return latest.close || null
}

function extractStockData(
  symbol: string,
  fundamentals: any,
  currentPrice: number | null
): StockData | null {
  if (!currentPrice || currentPrice <= 0) {
    return null
  }

  let name = symbol
  let sector = 'N/A'
  let eps: number | null = null
  let pe: number | null = null
  let roe: number | null = null
  let growth_rate = 0

  if (fundamentals && fundamentals.ratios && fundamentals.ratios.length > 0) {
    const years = fundamentals.ratios.map((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      return typeof year === 'number' ? year : parseInt(String(year)) || 0
    })
    const latestYear = Math.max(...years)
    
    const latestRatio = fundamentals.ratios.find((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
      return yearNum === latestYear
    }) || fundamentals.ratios[0]
    
    eps = latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
          latestRatio?.['Chỉ tiêu định giá_EPS'] ||
          latestRatio?.EPS ||
          latestRatio?.eps ||
          null
    pe = latestRatio?.['Chỉ tiêu định giá_P/E'] ||
         latestRatio?.['Chỉ tiêu định giá_P_E'] ||
         latestRatio?.P_E ||
         latestRatio?.pe ||
         null
    roe = latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] ||
          latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE (%)'] ||
          latestRatio?.ROE ||
          latestRatio?.roe ||
          null

    if (fundamentals.ratios.length >= 2) {
      const currentEps = 
        latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
        latestRatio?.['Chỉ tiêu định giá_EPS'] ||
        latestRatio?.EPS ||
        latestRatio?.eps
      
      const sortedYears = [...years].sort((a, b) => b - a)
      if (sortedYears.length >= 2) {
        const previousYear = sortedYears[1]
        const previousRatio = fundamentals.ratios.find((r: any) => {
          const year = r['Meta_Năm'] || r['Năm'] || 0
          const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
          return yearNum === previousYear
        })
        
        if (previousRatio && currentEps) {
          const previousEps =
            previousRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
            previousRatio?.['Chỉ tiêu định giá_EPS'] ||
            previousRatio?.EPS ||
            previousRatio?.eps

          if (currentEps && previousEps && previousEps > 0) {
            growth_rate = ((currentEps - previousEps) / previousEps) * 100
          }
        }
      }
    }
  }

  if (fundamentals?.overview && fundamentals.overview.length > 0) {
    const overview = fundamentals.overview[0]
    name = overview?.Tên_công_ty || overview?.ten_cong_ty || overview?.name || symbol
    sector =
      overview?.Ngành || overview?.nganh || overview?.industry || overview?.sector || 'N/A'
  }

  if (eps !== null && eps !== undefined) {
    if (eps < 10 && eps > 0) {
      eps = eps * 1000
    } else if (eps > 100000) {
      eps = eps / 1000
    }
  }

  if (eps === null || eps === undefined || eps <= 0) {
    const estimatedPE = pe || 15
    const priceInVND = currentPrice * 1000
    eps = priceInVND / estimatedPE
  }

  const priceInVND = currentPrice * 1000
  const calculatedPE = priceInVND / eps

  if (roe === null || roe === undefined) {
    roe = 0
  }

  return {
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    sector: sector || 'N/A',
    price: currentPrice,
    eps: eps || 0,
    pe: calculatedPE || 0,
    roe: roe || 0,
    growth_rate: growth_rate || 0,
  }
}

async function importStock(symbol: string): Promise<{ success: boolean; message: string }> {
  try {
    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    })

    const currentPrice = getCurrentPrice(priceHistory)
    if (!currentPrice) {
      return { success: false, message: `Không lấy được giá hiện tại cho ${symbol}` }
    }

    let fundamentals: any = null
    try {
      fundamentals = await fetchVnstockFundamentals(symbol)
    } catch (error: any) {
      // Continue with minimal data
    }

    const stockData = extractStockData(symbol, fundamentals, currentPrice)
    if (!stockData) {
      return { success: false, message: `Không thể extract dữ liệu cho ${symbol}` }
    }

    await prisma.stock.upsert({
      where: { symbol: stockData.symbol },
      update: {
        name: stockData.name,
        sector: stockData.sector,
        price: stockData.price,
        eps: stockData.eps,
        pe: stockData.pe,
        roe: stockData.roe,
        growth_rate: stockData.growth_rate,
      },
      create: {
        symbol: stockData.symbol,
        name: stockData.name,
        sector: stockData.sector,
        price: stockData.price,
        eps: stockData.eps,
        pe: stockData.pe,
        roe: stockData.roe,
        growth_rate: stockData.growth_rate,
      },
    })

    return { success: true, message: `Đã import ${symbol} thành công` }
  } catch (error: any) {
    return { success: false, message: `Lỗi khi import ${symbol}: ${error.message}` }
  }
}

export async function importStocksFromVnstock() {
  try {
    const results: { symbol: string; success: boolean; message: string }[] = []

    for (const symbol of POPULAR_SYMBOLS) {
      const result = await importStock(symbol)
      results.push({ symbol, ...result })
      
      // Delay để tránh rate limit
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    // Revalidate pages
    revalidatePath('/')
    revalidatePath('/admin/stocks')

    return {
      success: true,
      message: `Import hoàn tất: ${successCount} thành công, ${failCount} thất bại`,
      results,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi khi import: ${error.message}`,
      results: [],
    }
  }
}

