/**
 * Script: Cập nhật chỉ số tài chính từ VNStock cho các mã đã có trong DB
 * 
 * Hướng dẫn chạy:
 * npm run update:fundamentals
 * 
 * Hoặc:
 * npx tsx scripts/updateFundamentals.ts
 */

import { prisma } from '../lib/prisma'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
} from '../lib/vnstockClient'

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

/**
 * Lấy giá hiện tại từ price history
 */
function getCurrentPrice(priceHistory: any[]): number | null {
  if (!priceHistory || priceHistory.length === 0) return null
  const latest = priceHistory[priceHistory.length - 1]
  return latest.close || null
}

/**
 * Extract dữ liệu từ vnstock fundamentals
 */
function extractStockData(
  symbol: string,
  fundamentals: any,
  currentPrice: number | null
): StockData | null {
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
    // Tìm năm gần nhất (năm lớn nhất) - không phải phần tử cuối cùng
    // vì mảng có thể được sắp xếp theo thứ tự bất kỳ
    const years = fundamentals.ratios.map((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      return typeof year === 'number' ? year : parseInt(String(year)) || 0
    })
    const latestYear = Math.max(...years)
    
    // Lấy ratio của năm gần nhất
    const latestRatio = fundamentals.ratios.find((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
      return yearNum === latestYear
    }) || fundamentals.ratios[0] // Fallback: lấy phần tử đầu tiên
    
    console.log(`  📅 Đang sử dụng dữ liệu từ năm ${latestYear}`)
    
    // Tìm EPS - có thể ở các key khác nhau do MultiIndex columns đã được flatten
    eps =
      latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
      latestRatio?.['Chỉ tiêu định giá_EPS'] ||
      latestRatio?.EPS ||
      latestRatio?.eps ||
      null

    // Tìm P/E
    pe =
      latestRatio?.['Chỉ tiêu định giá_P/E'] ||
      latestRatio?.['Chỉ tiêu định giá_P_E'] ||
      latestRatio?.P_E ||
      latestRatio?.pe ||
      latestRatio?.P_E_ ||
      null

    // Tìm ROE - có thể là % hoặc số thập phân
    // Lưu ý: có thể là "lời" hoặc "lợi" trong key
    const roeValue =
      latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] ||
      latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE (%)'] ||
      latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE'] ||
      latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE'] ||
      latestRatio?.ROE ||
      latestRatio?.roe ||
      null
    
    // ROE có thể là số thập phân (0.1874 = 18.74%) hoặc đã là % (18.74)
    if (roeValue !== null && roeValue !== undefined) {
      const roeNum = typeof roeValue === 'number' ? roeValue : parseFloat(String(roeValue))
      if (!isNaN(roeNum)) {
        // Nếu giá trị < 1, coi là số thập phân (0.1874) -> nhân 100
        // Nếu giá trị >= 1, coi là đã là % (18.74)
        roe = roeNum < 1 ? roeNum * 100 : roeNum
      }
    }

    // Tính tăng trưởng từ EPS - so sánh với năm trước đó
    if (fundamentals.ratios.length >= 2) {
      const currentEps =
        latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
        latestRatio?.['Chỉ tiêu định giá_EPS'] ||
        latestRatio?.EPS ||
        latestRatio?.eps
      
      // Tìm năm trước đó (năm lớn thứ 2)
      const sortedYears = [...years].sort((a, b) => b - a) // Sắp xếp giảm dần
      if (sortedYears.length >= 2) {
        const previousYear = sortedYears[1]
        const previousRatio = fundamentals.ratios.find((r: any) => {
          const year = r['Meta_Năm'] || r['Năm'] || 0
          const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
          return yearNum === previousYear
        })
        
        if (previousRatio) {
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

  // Lấy tên công ty và ngành từ overview
  if (fundamentals?.overview && fundamentals.overview.length > 0) {
    const overview = fundamentals.overview[0]
    name = overview?.Tên_công_ty || overview?.ten_cong_ty || overview?.name || symbol
    
    // Tìm sector từ các trường có thể có
    sector =
      overview?.icb_name3 || // Ngành cấp 3
      overview?.icb_name4 || // Ngành cấp 4
      overview?.Ngành ||
      overview?.nganh ||
      overview?.industry ||
      overview?.sector ||
      'N/A'
  }

  // Validate và chuẩn hóa EPS từ vnstock
  if (eps !== null && eps !== undefined) {
    // EPS thường nằm trong khoảng 100 - 50,000 VND cho cổ phiếu VN
    // Nếu EPS quá nhỏ (< 10), có thể đơn vị sai (đang là nghìn VND thay vì VND)
    if (eps < 10 && eps > 0) {
      console.warn(`⚠️  ${symbol}: EPS từ vnstock quá nhỏ (${eps.toFixed(2)}), có thể đơn vị sai. Nhân 1000...`)
      eps = eps * 1000
    } else if (eps > 100000) {
      console.warn(`⚠️  ${symbol}: EPS từ vnstock quá lớn (${eps.toFixed(2)}), có thể đơn vị sai. Chia 1000...`)
      eps = eps / 1000
    }
    console.log(`  ✓ EPS từ vnstock: ${eps.toFixed(2)} VND`)
  }

  // Nếu không có EPS từ fundamentals, ước tính từ P/E
  if (eps === null || eps === undefined || eps <= 0) {
    const estimatedPE = pe || 15
    // currentPrice đang ở đơn vị nghìn VND, cần convert sang VND trước khi tính
    const priceInVND = currentPrice * 1000
    eps = priceInVND / estimatedPE
    if (!pe) {
      console.warn(`⚠️  Không có EPS cho ${symbol}, ước tính từ P/E ${estimatedPE}: ${eps.toFixed(2)} VND`)
    } else {
      console.log(`  ✓ EPS ước tính từ P/E ${estimatedPE}: ${eps.toFixed(2)} VND`)
    }
  }

  // P/E hiện tại PHẢI được tính từ giá hiện tại (Price/EPS), không lấy từ vnstock fundamentals
  // Vì P/E từ vnstock fundamentals là P/E của kỳ báo cáo (tính từ giá tham chiếu của kỳ đó)
  // Còn P/E hiện tại cần tính từ giá đóng cửa hiện tại
  // Price từ vnstock price history đang theo đơn vị nghìn VND (ví dụ: 58.3 = 58,300 VND)
  // EPS đã được chuẩn hóa về đơn vị VND
  // P/E hiện tại = Price (VND) / EPS (VND) = (Price * 1000) / EPS
  const priceInVND = currentPrice * 1000
  const calculatedPE = priceInVND / eps
  
  // Validation: P/E hợp lý thường nằm trong khoảng 5-50
  if (calculatedPE < 0.1 || calculatedPE > 100) {
    console.warn(`⚠️  ${symbol}: P/E tính toán bất thường (${calculatedPE.toFixed(2)}). Price=${priceInVND.toLocaleString('vi-VN')} VND, EPS=${eps.toFixed(2)} VND`)
  }
  const finalROE = roe !== null && roe !== undefined ? roe : 0

  return {
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    sector: sector || 'N/A',
    price: currentPrice,
    eps: eps || 0,
    pe: calculatedPE || 0,
    roe: finalROE || 0,
    growth_rate: growth_rate || 0,
  }
}

/**
 * Update fundamental data cho một cổ phiếu
 */
async function updateStockFundamentals(symbol: string): Promise<boolean> {
  try {
    console.log(`\n🔄 Đang cập nhật ${symbol}...`)

    // Lấy price history để có giá hiện tại
    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    })

    const currentPrice = getCurrentPrice(priceHistory)
    if (!currentPrice) {
      console.error(`❌ Không lấy được giá hiện tại cho ${symbol}`)
      return false
    }

    console.log(`  ✓ Giá hiện tại: ${currentPrice.toLocaleString('vi-VN')} VND`)

    // Lấy fundamentals - thử lại 2 lần nếu fail
    let fundamentals: any = null
    let retryCount = 0
    const maxRetries = 2

    while (retryCount <= maxRetries && !fundamentals) {
      try {
        fundamentals = await fetchVnstockFundamentals(symbol)
        console.log(`  ✓ Đã lấy fundamentals`)
        break
      } catch (error: any) {
        retryCount++
        if (retryCount <= maxRetries) {
          console.warn(`  ⚠️  Lỗi lần ${retryCount}, thử lại sau 2 giây...`)
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } else {
          console.warn(`  ⚠️  Không lấy được fundamentals cho ${symbol} sau ${maxRetries} lần thử: ${error.message}`)
          console.warn(`  ⚠️  Bỏ qua cập nhật ${symbol} vì không có fundamental data`)
          return false
        }
      }
    }

    // Extract dữ liệu
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

    // Update vào DB
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

/**
 * Main function
 */
async function main() {
  console.log('🚀 Bắt đầu cập nhật chỉ số tài chính từ VNStock...')
  console.log('⚠️  Đảm bảo VNStock service đang chạy tại http://localhost:8000\n')

  // Lấy danh sách mã hiện có trong DB
  const existingStocks = await prisma.stock.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' },
  })

  const existingSymbols = existingStocks.map((s) => s.symbol)
  console.log(`📋 Tìm thấy ${existingSymbols.length} mã trong DB: ${existingSymbols.join(', ')}\n`)

  if (existingSymbols.length === 0) {
    console.log('❌ Không có mã nào trong database để cập nhật')
    return
  }

  const results: { symbol: string; success: boolean }[] = []

  for (const symbol of existingSymbols) {
    const success = await updateStockFundamentals(symbol)
    results.push({ symbol, success })

    // Delay nhẹ giữa các request để tránh rate limit
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  // Tóm tắt kết quả
  console.log('\n' + '='.repeat(60))
  console.log('📊 TÓM TẮT KẾT QUẢ')
  console.log('='.repeat(60))

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  console.log(`\n✅ Thành công: ${successCount}/${results.length}`)
  console.log(`❌ Thất bại: ${failCount}/${results.length}`)

  if (successCount > 0) {
    console.log('\n✨ Đã cập nhật chỉ số tài chính thành công!')
    console.log('💡 Bạn có thể kiểm tra bằng cách:')
    console.log('   - Mở http://localhost:3000 để xem danh sách cổ phiếu')
    console.log('   - Hoặc chạy: npx prisma studio')
  }

  // Hiển thị chi tiết các mã thành công/thất bại
  if (successCount > 0) {
    console.log('\n📋 Các mã đã cập nhật thành công:')
    results
      .filter((r) => r.success)
      .forEach(({ symbol }) => {
        console.log(`   ✅ ${symbol}`)
      })
  }

  if (failCount > 0) {
    console.log('\n⚠️  Các mã không thể cập nhật:')
    results
      .filter((r) => !r.success)
      .forEach(({ symbol }) => {
        console.log(`   ❌ ${symbol}`)
      })
  }
}

main()
  .catch((error) => {
    console.error('❌ Lỗi fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

