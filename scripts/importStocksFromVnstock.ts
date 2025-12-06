/**
 * Script ETL: Import dữ liệu cổ phiếu từ VNStock service vào Database
 * 
 * Hướng dẫn chạy:
 * 1. Đảm bảo VNStock service đang chạy tại http://localhost:8000
 * 2. Từ root của project:
 *    npx tsx scripts/importStocksFromVnstock.ts
 * 
 * Hoặc nếu đã cài tsx global:
 *    tsx scripts/importStocksFromVnstock.ts
 */

import { prisma } from '../lib/prisma'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
} from '../lib/vnstockClient'

/**
 * Danh sách mã cổ phiếu phổ biến trên thị trường Việt Nam
 * Bao gồm các mã trong VN30, HNX30 và một số mã blue-chip khác
 * Đã loại bỏ trùng lặp
 */
const POPULAR_SYMBOLS = [
  // VN30 - Top 30 mã vốn hóa lớn nhất
  'VCB', // Ngân hàng Ngoại Thương
  'VIC', // Vingroup
  'VHM', // Vinhomes
  'VRE', // Vincom Retail
  'VNM', // Vinamilk
  'MSN', // Masan Group
  'HPG', // Hòa Phát
  'MWG', // Thế Giới Di Động
  'FPT', // FPT
  'TCB', // Techcombank
  'BID', // BIDV
  'CTG', // Vietinbank
  'MBB', // MBBank
  'VPB', // VPBank
  'SSI', // SSI Securities
  'VJC', // Vietjet Air
  'GAS', // PV Gas
  'PLX', // Petrolimex
  'POW', // Điện lực
  'VSH', // VNPT
  'VGC', // Viglacera
  'VHC', // Vinh Hoan
  'VND', // VNDirect
  'VCI', // Vietcombank Securities
  'VSC', // VSC
  'VTO', // Viettel Post
  'VTS', // VTS

  // HNX30 - Top 30 mã trên sàn HNX
  'ACB', // ACB
  'SHB', // SHB
  'VCS', // VCS
  'BSI', // BSI
  'HDB', // HDBank
  'LPB', // LienVietPostBank
  'NVB', // Navibank
  'OCB', // OCB
  'TPB', // TPBank

  // Các mã blue-chip khác
  'DGC', // Đức Giang
  'DXG', // Đất Xanh
  'DXS', // Đất Xanh Services
  'EVE', // Everpia
  'FCM', // FCM
  'FRT', // FRT
  'GMD', // GMD
  'HCM', // HCM
  'HNG', // HNG
  'HQC', // HQC
  'HSG', // Hoa Sen Group
  'HVN', // Vietnam Airlines
  'IDV', // IDV
  'KBC', // KBC
  'KDC', // KDC
  'KDH', // KDH
  'KOS', // KOS
  'MSH', // MSH
  'NVL', // Novaland
  'PDR', // PDR
  'PNJ', // Phú Nhuận Jewelry
  'QCG', // QCG
  'REE', // REE
  'ROS', // ROS
  'SAB', // Sabeco
  'SBT', // SBT
  'SSB', // SSB
  'STB', // Sacombank
  'TCH', // TCH
  'TNG', // TNG
]

// Danh sách mã mặc định (có thể override bằng command line arguments)
let SYMBOLS_TO_IMPORT: string[] = [...POPULAR_SYMBOLS]

// Kiểm tra command line arguments
const args = process.argv.slice(2)
if (args.length > 0) {
  // Nếu có arguments, dùng danh sách từ command line
  // Ví dụ: npm run import:vnstock -- MWG FPT VNM
  // hoặc: npm run import:vnstock -- --symbols=MWG,FPT,VNM
  const symbolsArg = args.find((arg) => arg.startsWith('--symbols='))
  if (symbolsArg) {
    SYMBOLS_TO_IMPORT = symbolsArg
      .split('=')[1]
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0)
  } else {
    // Nếu không có --symbols=, coi tất cả args là danh sách mã
    SYMBOLS_TO_IMPORT = args.map((s) => s.trim().toUpperCase()).filter((s) => s.length > 0)
  }
  console.log(`📝 Sử dụng danh sách mã từ command line (${SYMBOLS_TO_IMPORT.length} mã)`)
  if (SYMBOLS_TO_IMPORT.length <= 10) {
    console.log(`📝 Danh sách: ${SYMBOLS_TO_IMPORT.join(', ')}`)
  } else {
    console.log(`📝 Danh sách: ${SYMBOLS_TO_IMPORT.slice(0, 10).join(', ')}... (+${SYMBOLS_TO_IMPORT.length - 10} mã khác)`)
  }
} else {
  console.log(`📝 Sử dụng danh sách mã mặc định (${POPULAR_SYMBOLS.length} mã)`)
  console.log(`💡 Tip: Có thể chỉ định mã cụ thể: npm run import:vnstock -- MWG FPT VNM`)
  console.log(`💡 Hoặc: npm run import:vnstock -- --symbols=MWG,FPT,VNM`)
}

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
 * Lấy giá hiện tại từ price history (giá đóng cửa gần nhất)
 */
function getCurrentPrice(priceHistory: any[]): number | null {
  if (!priceHistory || priceHistory.length === 0) return null
  const latest = priceHistory[priceHistory.length - 1]
  return latest.close || null
}

/**
 * Extract dữ liệu từ vnstock fundamentals
 * Nếu không có fundamentals, vẫn tạo dữ liệu tối thiểu từ price
 */
function extractStockData(
  symbol: string,
  fundamentals: any,
  currentPrice: number | null
): StockData | null {
  // Validate giá hiện tại
  if (!currentPrice || currentPrice <= 0) {
    console.warn(`⚠️  Giá hiện tại không hợp lệ cho ${symbol}: ${currentPrice}`)
    return null
  }

  // Khởi tạo giá trị mặc định
  let name = symbol
  let sector = 'N/A'
  let eps: number | null = null
  let pe: number | null = null
  let roe: number | null = null
  let growth_rate = 0

  // Nếu có fundamentals, extract từ đó
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
    
    eps = latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
          latestRatio?.['Chỉ tiêu định giá_EPS'] ||
          latestRatio?.EPS ||
          latestRatio?.eps ||
          null
    pe = latestRatio?.['Chỉ tiêu định giá_P/E'] ||
         latestRatio?.['Chỉ tiêu định giá_P_E'] ||
         latestRatio?.P_E ||
         latestRatio?.pe ||
         latestRatio?.P_E_ ||
         null
    roe = latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] ||
          latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE (%)'] ||
          latestRatio?.ROE ||
          latestRatio?.roe ||
          null

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

  // Nếu không có EPS từ fundamentals, ước tính từ P/E trung bình ngành (15)
  if (eps === null || eps === undefined || eps <= 0) {
    const estimatedPE = pe || 15 // P/E mặc định nếu không có
    // currentPrice đang ở đơn vị nghìn VND, cần convert sang VND trước khi tính
    const priceInVND = currentPrice * 1000
    eps = priceInVND / estimatedPE
    console.warn(`⚠️  Không có EPS cho ${symbol}, ước tính từ P/E ${estimatedPE}: ${eps.toFixed(2)} VND`)
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

  // Nếu không có ROE, đặt mặc định 0
  if (roe === null || roe === undefined) {
    console.warn(`⚠️  Không có ROE cho ${symbol}, đặt mặc định 0`)
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

/**
 * Import một cổ phiếu từ vnstock vào DB
 */
async function importStock(symbol: string): Promise<boolean> {
  try {
    console.log(`\n📥 Đang import ${symbol}...`)

    // Lấy price history để có giá hiện tại
    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 ngày gần nhất
      end: new Date().toISOString().split('T')[0],
    })

    const currentPrice = getCurrentPrice(priceHistory)
    if (!currentPrice) {
      console.error(`❌ Không lấy được giá hiện tại cho ${symbol}`)
      return false
    }

    console.log(`  ✓ Giá hiện tại: ${currentPrice.toLocaleString('vi-VN')} VND`)

    // Lấy fundamentals (có thể fail, nhưng vẫn tiếp tục với dữ liệu tối thiểu)
    let fundamentals: any = null
    try {
      fundamentals = await fetchVnstockFundamentals(symbol)
      console.log(`  ✓ Đã lấy fundamentals`)
    } catch (error: any) {
      console.warn(`  ⚠️  Không lấy được fundamentals cho ${symbol}: ${error.message}`)
      console.warn(`  ⚠️  Sẽ import với dữ liệu tối thiểu (chỉ có giá)`)
    }

    // Extract và validate dữ liệu
    const stockData = extractStockData(symbol, fundamentals, currentPrice)
    if (!stockData) {
      console.error(`❌ Không thể extract dữ liệu cho ${symbol}`)
      return false
    }

    console.log(`  ✓ Dữ liệu:`, {
      name: stockData.name,
      sector: stockData.sector,
      price: stockData.price,
      eps: stockData.eps,
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

    console.log(`  ✅ Đã import ${symbol} vào database`)
    return true
  } catch (error: any) {
    console.error(`❌ Lỗi khi import ${symbol}:`, error.message)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Bắt đầu import dữ liệu từ VNStock vào Database...')
  console.log(`📋 Tổng số mã sẽ import: ${SYMBOLS_TO_IMPORT.length}`)
  console.log(`📋 Danh sách mã: ${SYMBOLS_TO_IMPORT.slice(0, 10).join(', ')}${SYMBOLS_TO_IMPORT.length > 10 ? '...' : ''}`)
  console.log('⚠️  Đảm bảo VNStock service đang chạy tại http://localhost:8000\n')

  const results: { symbol: string; success: boolean }[] = []

  for (const symbol of SYMBOLS_TO_IMPORT) {
    const success = await importStock(symbol)
    results.push({ symbol, success })

    // Delay nhẹ giữa các request để tránh rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Tóm tắt kết quả
  console.log('\n' + '='.repeat(50))
  console.log('📊 TÓM TẮT KẾT QUẢ:')
  console.log('='.repeat(50))

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  results.forEach(({ symbol, success }) => {
    console.log(`${success ? '✅' : '❌'} ${symbol}`)
  })

  console.log(`\n✅ Thành công: ${successCount}/${results.length}`)
  console.log(`❌ Thất bại: ${failCount}/${results.length}`)

  if (successCount > 0) {
    console.log('\n✨ Đã import dữ liệu vào database thành công!')
    console.log('💡 Bạn có thể kiểm tra bằng cách:')
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

