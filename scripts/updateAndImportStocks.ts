/**
 * Script: Update fundamental data cho các mã đã có + import thêm 50 mã mới
 * 
 * Hướng dẫn chạy:
 * npm run update:stocks
 * 
 * Hoặc:
 * npx tsx scripts/updateAndImportStocks.ts
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
    eps = latestRatio?.EPS || latestRatio?.eps || null
    pe = latestRatio?.P_E || latestRatio?.pe || latestRatio?.P_E_ || null
    roe = latestRatio?.ROE || latestRatio?.roe || null

    // Tính tăng trưởng từ EPS
    if (fundamentals.ratios.length >= 2) {
      const currentEps = latestRatio?.EPS || latestRatio?.eps
      const previousEps =
        fundamentals.ratios[fundamentals.ratios.length - 2]?.EPS ||
        fundamentals.ratios[fundamentals.ratios.length - 2]?.eps

      if (currentEps && previousEps && previousEps > 0) {
        growth_rate = ((currentEps - previousEps) / previousEps) * 100
      }
    }
  }

  // Lấy tên công ty và ngành từ overview
  if (fundamentals?.overview && fundamentals.overview.length > 0) {
    const overview = fundamentals.overview[0]
    name = overview?.Tên_công_ty || overview?.ten_cong_ty || overview?.name || symbol
    sector =
      overview?.Ngành || overview?.nganh || overview?.industry || overview?.sector || 'N/A'
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

  // Tính P/E hiện tại từ giá hiện tại và EPS
  // Price từ vnstock price history đang theo đơn vị nghìn VND
  // EPS đã được chuẩn hóa về đơn vị VND
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
 * Update hoặc import một cổ phiếu
 */
async function updateOrImportStock(symbol: string, isUpdate: boolean = false): Promise<boolean> {
  try {
    const action = isUpdate ? '🔄 Cập nhật' : '📥 Import'
    console.log(`\n${action} ${symbol}...`)

    // Lấy price history
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

    // Lấy fundamentals
    let fundamentals: any = null
    try {
      fundamentals = await fetchVnstockFundamentals(symbol)
      console.log(`  ✓ Đã lấy fundamentals`)
    } catch (error: any) {
      console.warn(`  ⚠️  Không lấy được fundamentals cho ${symbol}: ${error.message}`)
      if (isUpdate) {
        console.warn(`  ⚠️  Bỏ qua cập nhật ${symbol} vì không có fundamental data`)
        return false
      }
      console.warn(`  ⚠️  Sẽ import với dữ liệu tối thiểu`)
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

    // Upsert vào DB
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

    console.log(`  ✅ ${isUpdate ? 'Đã cập nhật' : 'Đã import'} ${symbol} vào database`)
    return true
  } catch (error: any) {
    console.error(`❌ Lỗi khi ${isUpdate ? 'cập nhật' : 'import'} ${symbol}:`, error.message)
    return false
  }
}

/**
 * Danh sách 50 mã mới để import
 */
const NEW_SYMBOLS = [
  'ACB', 'SHB', 'VCS', 'BSI', 'HDB', 'LPB', 'NVB', 'OCB', 'TPB',
  'DGC', 'DXG', 'DXS', 'EVE', 'FCM', 'FRT', 'GMD', 'HCM', 'HNG',
  'HQC', 'HSG', 'HVN', 'IDV', 'KBC', 'KDC', 'KDH', 'KOS', 'MSH',
  'NVL', 'PDR', 'PNJ', 'QCG', 'REE', 'ROS', 'SAB', 'SBT', 'SSB',
  'STB', 'TCH', 'TNG', 'VGC', 'VHC', 'VJC', 'VND', 'VRE', 'VSC',
  'VSH', 'VTO', 'VTS', 'VIC', 'VHM', 'MSN'
]

/**
 * Main function
 */
async function main() {
  console.log('🚀 Bắt đầu cập nhật và import cổ phiếu...')
  console.log('⚠️  Đảm bảo VNStock service đang chạy tại http://localhost:8000\n')

  // Bước 1: Lấy danh sách mã hiện có trong DB
  const existingStocks = await prisma.stock.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' },
  })

  const existingSymbols = existingStocks.map((s) => s.symbol)
  console.log(`📋 Tìm thấy ${existingSymbols.length} mã đã có trong DB: ${existingSymbols.join(', ')}`)

  // Bước 2: Update fundamental cho các mã đã có
  const updateResults: { symbol: string; success: boolean }[] = []
  if (existingSymbols.length > 0) {
    console.log(`\n${'='.repeat(60)}`)
    console.log('BƯỚC 1: CẬP NHẬT FUNDAMENTAL CHO CÁC MÃ ĐÃ CÓ')
    console.log('='.repeat(60))

    for (const symbol of existingSymbols) {
      const success = await updateOrImportStock(symbol, true)
      updateResults.push({ symbol, success })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Bước 3: Lọc các mã mới (chưa có trong DB)
  const symbolsToImport = NEW_SYMBOLS.filter((s) => !existingSymbols.includes(s.toUpperCase()))
  console.log(`\n${'='.repeat(60)}`)
  console.log('BƯỚC 2: IMPORT THÊM 50 MÃ MỚI')
  console.log('='.repeat(60))
  console.log(`📋 Số mã mới sẽ import: ${symbolsToImport.length}`)
  console.log(`📋 Danh sách: ${symbolsToImport.slice(0, 10).join(', ')}${symbolsToImport.length > 10 ? '...' : ''}\n`)

  const importResults: { symbol: string; success: boolean }[] = []
  for (const symbol of symbolsToImport) {
    const success = await updateOrImportStock(symbol, false)
    importResults.push({ symbol, success })
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Tóm tắt kết quả
  console.log('\n' + '='.repeat(60))
  console.log('📊 TÓM TẮT KẾT QUẢ')
  console.log('='.repeat(60))

  if (updateResults.length > 0) {
    const updateSuccess = updateResults.filter((r) => r.success).length
    console.log(`\n🔄 CẬP NHẬT FUNDAMENTAL:`)
    console.log(`   ✅ Thành công: ${updateSuccess}/${updateResults.length}`)
    console.log(`   ❌ Thất bại: ${updateResults.length - updateSuccess}/${updateResults.length}`)
  }

  const importSuccess = importResults.filter((r) => r.success).length
  console.log(`\n📥 IMPORT MÃ MỚI:`)
  console.log(`   ✅ Thành công: ${importSuccess}/${importResults.length}`)
  console.log(`   ❌ Thất bại: ${importResults.length - importSuccess}/${importResults.length}`)

  const totalSuccess = (updateResults.filter((r) => r.success).length) + importSuccess
  const total = updateResults.length + importResults.length
  console.log(`\n✨ TỔNG KẾT:`)
  console.log(`   ✅ Thành công: ${totalSuccess}/${total}`)
  console.log(`   ❌ Thất bại: ${total - totalSuccess}/${total}`)

  if (totalSuccess > 0) {
    console.log('\n💡 Bạn có thể kiểm tra bằng cách:')
    console.log('   - Mở http://localhost:3000 để xem danh sách cổ phiếu')
    console.log('   - Hoặc chạy: npx prisma studio')
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

