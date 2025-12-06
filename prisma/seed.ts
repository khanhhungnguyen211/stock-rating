import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const stocks = [
    {
      symbol: 'FPT',
      name: 'Công ty Cổ phần FPT',
      sector: 'Công nghệ thông tin',
      price: 125000,
      eps: 8500,
      pe: 14.7,
      roe: 25.5,
      growth_rate: 15,
    },
    {
      symbol: 'VCB',
      name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
      sector: 'Ngân hàng',
      price: 95000,
      eps: 6500,
      pe: 14.6,
      roe: 22.8,
      growth_rate: 12,
    },
    {
      symbol: 'VNM',
      name: 'Công ty Cổ phần Sữa Việt Nam',
      sector: 'Thực phẩm & Đồ uống',
      price: 78000,
      eps: 5200,
      pe: 15.0,
      roe: 28.2,
      growth_rate: 8,
    },
    {
      symbol: 'MWG',
      name: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
      sector: 'Bán lẻ',
      price: 68000,
      eps: 4200,
      pe: 16.2,
      roe: 18.5,
      growth_rate: 10,
    },
    {
      symbol: 'HPG',
      name: 'Tập đoàn Hòa Phát',
      sector: 'Thép',
      price: 32000,
      eps: 2800,
      pe: 11.4,
      roe: 15.8,
      growth_rate: 5,
    },
  ]

  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock,
    })
    console.log(`✅ Seeded stock: ${stock.symbol}`)
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


