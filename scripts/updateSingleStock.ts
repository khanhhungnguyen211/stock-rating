/**
 * Script: Update một mã cổ phiếu cụ thể
 * 
 * Hướng dẫn chạy:
 * npx tsx scripts/updateSingleStock.ts FRT
 */

import { prisma } from '../lib/prisma'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
} from '../lib/vnstockClient'

// Import hàm extractStockData từ updateFundamentals
async function getCurrentPrice(priceHistory: any[]): Promise<number | null> {
  if (!priceHistory || priceHistory.length === 0) return null
  const latest = priceHistory[priceHistory.length - 1]
  return latest.close || null
}

function extractStockData(
  symbol: string,
  fundamentals: any,
  currentPrice: number | null
): any {
  if (!currentPrice || currentPrice <= 0) {
    console.warn(`⚠️  Giá hiện tại không hợp lệ cho ${symbol}: ${currentPrice}`)
    return null
  }

  let name = symbol
  let sector = 'N/A'
  let eps: number | null = null
  let pe: number | null = null
  let roe: number | null = null
  let growth_rate = 0

  // Extract từ fundamentals nếu có
  if (fundamentals && fundamentals.ratios && fundamentals.ratios.length > 0) {
    // Tìm năm gần nhất (năm lớn nhất)
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
    
    console.log(`  📅 Đang sử dụng dữ liệu từ năm ${latestYear}`)
    
    eps =
      latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
      latestRatio?.['Chỉ tiêu định giá_EPS'] ||
      latestRatio?.EPS ||
      latestRatio?.eps ||
      null

    pe =
      latestRatio?.['Chỉ tiêu định giá_P/E'] ||
      latestRatio?.['Chỉ tiêu định giá_P_E'] ||
      latestRatio?.P_E ||
      latestRatio?.pe ||
      latestRatio?.P_E_ ||
      null

    const roeValue =
      latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] ||
      latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE (%)'] ||
      latestRatio?.ROE ||
      latestRatio?.roe ||
      null
    
    if (roeValue !== null && roeValue !== undefined) {
      const roeNum = typeof roeValue === 'number' ? roeValue : parseFloat(String(roeValue))
      if (!isNaN(roeNum)) {
        roe = roeNum < 1 ? roeNum * 100 : roeNum
      }
    }

    // Tính tăng trưởng
    const sortedYears = [...years].sort((a, b) => b - a)
    if (sortedYears.length >= 2) {
      const previousYear = sortedYears[1]
      const previousRatio = fundamentals.ratios.find((r: any) => {
        const year = r['Meta_Năm'] || r['Năm'] || 0
        const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
        return yearNum === previousYear
      })
      
      if (previousRatio) {
        const currentEps =
          latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
          latestRatio?.['Chỉ tiêu định giá_EPS'] ||
          latestRatio?.EPS ||
          latestRatio?.eps
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

  if (fundamentals?.overview && fundamentals.overview.length > 0) {
    const overview = fundamentals.overview[0]
    name = overview?.Tên_công_ty || overview?.ten_cong_ty || overview?.name || symbol
    sector =
      overview?.icb_name3 ||
      overview?.icb_name4 ||
      overview?.Ngành ||
      overview?.nganh ||
      overview?.industry ||
      overview?.sector ||
      'N/A'
  }

  // Validate và chuẩn hóa EPS
  if (eps !== null && eps !== undefined) {
    if (eps < 10 && eps > 0) {
      console.warn(`⚠️  ${symbol}: EPS từ vnstock quá nhỏ (${eps.toFixed(2)}), có thể đơn vị sai. Nhân 1000...`)
      eps = eps * 1000
    } else if (eps > 100000) {
      console.warn(`⚠️  ${symbol}: EPS từ vnstock quá lớn (${eps.toFixed(2)}), có thể đơn vị sai. Chia 1000...`)
      eps = eps / 1000
    }
    console.log(`  ✓ EPS từ vnstock: ${eps.toFixed(2)} VND`)
  }

  if (eps === null || eps === undefined || eps <= 0) {
    const estimatedPE = pe || 15
    const priceInVND = currentPrice * 1000
    eps = priceInVND / estimatedPE
    console.warn(`⚠️  Không có EPS cho ${symbol}, ước tính từ P/E ${estimatedPE}: ${eps.toFixed(2)} VND`)
  }

  const priceInVND = currentPrice * 1000
  const calculatedPE = priceInVND / eps
  
  if (calculatedPE < 0.1 || calculatedPE > 100) {
    console.warn(`⚠️  ${symbol}: P/E tính toán bất thường (${calculatedPE.toFixed(2)}). Price=${priceInVND.toLocaleString('vi-VN')} VND, EPS=${eps.toFixed(2)} VND`)
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

async function updateSingleStock(symbol: string) {
  try {
    console.log(`\n🔄 Đang cập nhật ${symbol}...`)

    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    })

    const currentPrice = await getCurrentPrice(priceHistory)
    if (!currentPrice) {
      console.error(`❌ Không lấy được giá hiện tại cho ${symbol}`)
      return false
    }

    console.log(`  ✓ Giá hiện tại: ${currentPrice.toLocaleString('vi-VN')} VND`)

    const fundamentals = await fetchVnstockFundamentals(symbol)
    console.log(`  ✓ Đã lấy fundamentals`)

    const stockData = extractStockData(symbol, fundamentals, currentPrice)
    if (!stockData) {
      console.error(`❌ Không thể extract dữ liệu cho ${symbol}`)
      return false
    }

    console.log(`  ✓ Dữ liệu:`, {
      name: stockData.name,
      sector: stockData.sector,
      price: stockData.price,
      eps: stockData.eps.toFixed(2),
      pe: stockData.pe.toFixed(2),
      roe: stockData.roe.toFixed(2),
      growth: stockData.growth_rate.toFixed(2) + '%',
    })

    await prisma.stock.update({
      where: { symbol: stockData.symbol },
      data: {
        name: stockData.name,
        sector: stockData.sector,
        price: stockData.price,
        eps: stockData.eps,
        pe: stockData.pe,
        roe: stockData.roe,
        growth_rate: stockData.growth_rate,
      },
    })

    console.log(`  ✅ Đã cập nhật ${symbol} vào database`)
    return true
  } catch (error: any) {
    console.error(`❌ Lỗi khi cập nhật ${symbol}:`, error.message)
    return false
  }
}

const symbol = process.argv[2]?.toUpperCase() || 'FRT'

updateSingleStock(symbol)
  .then(() => {
    console.log('\n✅ Hoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Lỗi fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

