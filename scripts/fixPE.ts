/**
 * Script: Sửa P/E hiện tại cho tất cả mã cổ phiếu
 * P/E hiện tại = Price / EPS (không lấy từ vnstock)
 */

import { prisma } from '../lib/prisma'

async function fixPE() {
  console.log('🔧 Bắt đầu sửa P/E hiện tại cho tất cả mã cổ phiếu...\n')

  const stocks = await prisma.stock.findMany({
    select: {
      id: true,
      symbol: true,
      price: true,
      eps: true,
      pe: true,
    },
  })

  console.log(`📋 Tìm thấy ${stocks.length} mã cổ phiếu\n`)

  let updated = 0
  let errors = 0

  for (const stock of stocks) {
    if (stock.eps === 0 || !stock.eps) {
      console.warn(`⚠️  ${stock.symbol}: EPS = 0, bỏ qua`)
      errors++
      continue
    }

    // P/E nên được lấy từ vnstock fundamentals (đã được tính từ giá tham chiếu chính xác)
    // Nhưng vì script này chỉ sửa P/E đã có trong DB, nên tính từ Price/EPS
    // Price trong DB đang lưu theo đơn vị nghìn VND (ví dụ: 58.3 = 58,300 VND)
    // EPS đang lưu theo đơn vị VND (ví dụ: 1880.56 VND)
    // P/E = Price (VND) / EPS (VND) = (Price * 1000) / EPS
    // Lưu ý: P/E này có thể khác với P/E từ vnstock fundamentals vì giá tham chiếu khác
    const priceInVND = stock.price * 1000
    const correctPE = priceInVND / stock.eps
    const oldPE = stock.pe

    // Chỉ update nếu khác biệt > 0.01
    if (Math.abs(correctPE - oldPE) > 0.01) {
      await prisma.stock.update({
        where: { id: stock.id },
        data: { pe: correctPE },
      })

      console.log(
        `✅ ${stock.symbol}: P/E ${oldPE.toFixed(2)} → ${correctPE.toFixed(2)} (Price=${stock.price}, EPS=${stock.eps.toFixed(2)})`
      )
      updated++
    } else {
      console.log(`✓ ${stock.symbol}: P/E đã đúng (${correctPE.toFixed(2)})`)
    }
  }

  console.log(`\n✨ Hoàn thành!`)
  console.log(`   ✅ Đã cập nhật: ${updated} mã`)
  console.log(`   ⚠️  Lỗi/Bỏ qua: ${errors} mã`)
}

fixPE()
  .catch((error) => {
    console.error('❌ Lỗi:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

