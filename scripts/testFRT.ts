/**
 * Script: Test update FRT với logic mới
 */

import { prisma } from '../lib/prisma'
import {
  fetchVnstockPriceHistory,
  fetchVnstockFundamentals,
} from '../lib/vnstockClient'

async function testFRT() {
  const symbol = 'FRT'
  console.log(`🔍 Testing ${symbol} với logic mới...\n`)

  try {
    // Lấy price history
    const priceHistory = await fetchVnstockPriceHistory(symbol, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    })

    const currentPrice = priceHistory && priceHistory.length > 0 
      ? priceHistory[priceHistory.length - 1].close 
      : null

    if (!currentPrice) {
      console.error('❌ Không lấy được giá hiện tại')
      return
    }

    console.log(`💰 Giá hiện tại: ${currentPrice} (nghìn VND) = ${currentPrice * 1000} VND\n`)

    // Lấy fundamentals
    const fundamentals = await fetchVnstockFundamentals(symbol)

    if (!fundamentals || !fundamentals.ratios || fundamentals.ratios.length === 0) {
      console.error('❌ Không có dữ liệu ratios')
      return
    }

    // Logic mới: Tìm năm gần nhất
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
    
    console.log(`📅 Đang sử dụng dữ liệu từ năm ${latestYear}\n`)

    const eps = 
      latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
      latestRatio?.['Chỉ tiêu định giá_EPS'] ||
      latestRatio?.EPS ||
      latestRatio?.eps ||
      null

    console.log(`📊 EPS từ năm ${latestYear}: ${eps}`)
    
    if (eps !== null && eps !== undefined) {
      const epsNum = typeof eps === 'number' ? eps : parseFloat(String(eps))
      const priceInVND = currentPrice * 1000
      const calculatedPE = priceInVND / epsNum
      console.log(`📈 P/E tính toán: ${priceInVND} / ${epsNum} = ${calculatedPE.toFixed(2)}`)
      
      if (epsNum < 0) {
        console.log(`\n⚠️  EPS âm! Công ty đang lỗ.`)
      } else if (epsNum > 0 && epsNum < 10) {
        console.log(`\n💡 EPS < 10, có thể là nghìn VND. Nếu nhân 1000: ${epsNum * 1000}`)
        const testPE = priceInVND / (epsNum * 1000)
        console.log(`   P/E nếu EPS = ${epsNum * 1000}: ${testPE.toFixed(2)}`)
      }
    }

    // So sánh với dữ liệu trong DB
    const stockInDB = await prisma.stock.findUnique({
      where: { symbol },
    })

    if (stockInDB) {
      console.log(`\n📋 Dữ liệu hiện tại trong DB:`)
      console.log(`  EPS: ${stockInDB.eps}`)
      console.log(`  P/E: ${stockInDB.pe.toFixed(2)}`)
    }

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testFRT()

