/**
 * Script: Debug dữ liệu từ vnstock cho một mã cổ phiếu
 * 
 * Hướng dẫn chạy:
 * npx tsx scripts/debugVnstockData.ts FRT
 */

import { fetchVnstockFundamentals, fetchVnstockPriceHistory } from '../lib/vnstockClient'

const symbol = process.argv[2]?.toUpperCase() || 'FRT'

async function debugVnstockData() {
  console.log(`🔍 Đang kiểm tra dữ liệu vnstock cho ${symbol}...\n`)

  try {
    // Lấy price history để có giá hiện tại
    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    })

    if (priceHistory && priceHistory.length > 0) {
      const latestPrice = priceHistory[priceHistory.length - 1]
      console.log('💰 Giá hiện tại từ price history:')
      console.log('='.repeat(60))
      console.log(`  Close: ${latestPrice.close} VND`)
      console.log(`  (Giá này đang ở đơn vị nghìn VND: ${latestPrice.close} = ${(latestPrice.close || 0) * 1000} VND)\n`)
    }

    const fundamentals = await fetchVnstockFundamentals(symbol)

    if (!fundamentals || !fundamentals.ratios || fundamentals.ratios.length === 0) {
      console.log('❌ Không có dữ liệu ratios')
      return
    }

    console.log(`📊 Tổng số ratios: ${fundamentals.ratios.length}\n`)

    // Hiển thị tất cả các năm và EPS
    console.log('📅 Tất cả các năm và EPS:')
    console.log('='.repeat(60))
    fundamentals.ratios.forEach((ratio: any, index: number) => {
      const year = ratio['Meta_Năm'] || ratio['Năm'] || 'N/A'
      const eps = ratio['Chỉ tiêu định giá_EPS (VND)'] || ratio['Chỉ tiêu định giá_EPS'] || ratio?.EPS || ratio?.eps || 'N/A'
      const pe = ratio['Chỉ tiêu định giá_P/E'] || ratio?.P_E || ratio?.pe || 'N/A'
      const roe = ratio['Chỉ tiêu khả năng sinh lợi_ROE (%)'] || ratio?.ROE || 'N/A'
      console.log(`  [${index}] Năm ${year}: EPS = ${eps}, P/E = ${pe}, ROE = ${roe}`)
    })

    // Tìm năm gần nhất (năm lớn nhất)
    const years = fundamentals.ratios.map((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      return typeof year === 'number' ? year : parseInt(String(year)) || 0
    })
    const latestYear = Math.max(...years)
    console.log(`\n📆 Năm gần nhất: ${latestYear}`)

    // Lấy ratio của năm gần nhất
    const latestRatio = fundamentals.ratios.find((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
      return yearNum === latestYear
    }) || fundamentals.ratios[fundamentals.ratios.length - 1]

    console.log(`\n📊 Dữ liệu từ năm ${latestYear}:`)
    console.log('='.repeat(60))
    
    const eps = 
      latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
      latestRatio?.['Chỉ tiêu định giá_EPS'] ||
      latestRatio?.EPS ||
      latestRatio?.eps ||
      null
    console.log(`EPS: ${eps} (${typeof eps})`)
    
    const pe = 
      latestRatio?.['Chỉ tiêu định giá_P/E'] ||
      latestRatio?.['Chỉ tiêu định giá_P_E'] ||
      latestRatio?.P_E ||
      latestRatio?.pe ||
      latestRatio?.P_E_ ||
      null
    console.log(`P/E: ${pe} (${typeof pe})`)

    const roe = 
      latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROE (%)'] ||
      latestRatio?.['Chỉ tiêu khả năng sinh lời_ROE (%)'] ||
      latestRatio?.ROE ||
      latestRatio?.roe ||
      null
    console.log(`ROE: ${roe} (${typeof roe})`)

    // Tìm năm có EPS dương gần nhất
    console.log(`\n🔍 Tìm năm có EPS dương gần nhất:`)
    console.log('='.repeat(60))
    let foundPositiveEPS = false
    for (let i = fundamentals.ratios.length - 1; i >= 0; i--) {
      const ratio = fundamentals.ratios[i]
      const year = ratio['Meta_Năm'] || ratio['Năm'] || 'N/A'
      const epsValue = ratio['Chỉ tiêu định giá_EPS (VND)'] || ratio['Chỉ tiêu định giá_EPS'] || ratio?.EPS || ratio?.eps
      
      if (epsValue !== null && epsValue !== undefined) {
        const epsNum = typeof epsValue === 'number' ? epsValue : parseFloat(String(epsValue))
        if (epsNum > 0) {
          console.log(`  Năm ${year}: EPS = ${epsNum}`)
          foundPositiveEPS = true
          break
        }
      }
    }
    if (!foundPositiveEPS) {
      console.log('  ❌ Không tìm thấy năm nào có EPS dương')
    }

    // Tính P/E từ giá và EPS nếu có
    if (priceHistory && priceHistory.length > 0 && eps !== null && eps !== undefined) {
      const currentPrice = priceHistory[priceHistory.length - 1].close
      if (currentPrice && eps !== 0) {
        const priceInVND = (currentPrice || 0) * 1000
        const epsNum = typeof eps === 'number' ? eps : parseFloat(String(eps))
        const calculatedPE = priceInVND / epsNum
        console.log(`\n🧮 Tính P/E từ giá và EPS:`)
        console.log(`  Giá hiện tại: ${currentPrice} (nghìn VND) = ${priceInVND} VND`)
        console.log(`  EPS: ${epsNum}`)
        console.log(`  P/E = ${priceInVND} / ${epsNum} = ${calculatedPE.toFixed(2)}`)
        
        // Nếu EPS âm, thử với EPS = 4.375 (nghìn VND)
        if (epsNum < 0) {
          console.log(`\n💡 Thử với EPS = 4.375 (nghìn VND) = 4,375 VND:`)
          const testEPS = 4.375 * 1000
          const testPE = priceInVND / testEPS
          console.log(`  P/E = ${priceInVND} / ${testEPS} = ${testPE.toFixed(2)}`)
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
    console.error(error.stack)
  }
}

debugVnstockData()
  .then(() => {
    console.log('\n✅ Hoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Lỗi fatal:', error)
    process.exit(1)
  })
