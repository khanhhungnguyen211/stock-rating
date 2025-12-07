/**
 * Script: Debug dữ liệu company overview từ vnstock
 * 
 * Hướng dẫn chạy:
 * npx tsx scripts/debugCompanyOverview.ts FPT
 */

import { fetchVnstockFundamentals } from '../lib/vnstockClient'

const symbol = process.argv[2]?.toUpperCase() || 'FPT'

async function debugCompanyOverview() {
  console.log(`🔍 Đang kiểm tra company overview từ vnstock cho ${symbol}...\n`)

  try {
    const fundamentals = await fetchVnstockFundamentals(symbol)

    if (!fundamentals || !fundamentals.overview || fundamentals.overview.length === 0) {
      console.log('❌ Không có dữ liệu overview')
      return
    }

    const overview = fundamentals.overview[0]
    
    console.log('📊 Tất cả các trường trong company overview:')
    console.log('='.repeat(80))
    console.log(JSON.stringify(overview, null, 2))
    
    console.log('\n📋 Danh sách tất cả các keys:')
    console.log('='.repeat(80))
    Object.keys(overview).forEach((key) => {
      const value = overview[key]
      console.log(`  - ${key}: ${value} (${typeof value})`)
    })

    // Kiểm tra các trường cụ thể
    console.log('\n🔍 Kiểm tra các trường quan trọng:')
    console.log('='.repeat(80))
    const importantFields = [
      'Tên_đầy_đủ', 'Tên_doanh_nghiệp', 'Tên_chính_thức', 'Tên_công_ty',
      'Người_đại_diện', 'Người_đại_diện_pháp_luật',
      'Vốn_điều_lệ', 'Vốn_điều_lệ_VND',
      'Số_lượng_cổ_phiếu', 'Số_lượng_cổ_phiếu_lưu_hành',
      'Sàn_giao_dịch', 'Sàn', 'Exchange',
    ]
    
    importantFields.forEach((field) => {
      const value = overview[field]
      if (value !== undefined && value !== null) {
        console.log(`  ✅ ${field}: ${value}`)
      }
    })

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message)
    console.error(error.stack)
  }
}

debugCompanyOverview()
  .then(() => {
    console.log('\n✅ Hoàn thành!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Lỗi fatal:', error)
    process.exit(1)
  })

