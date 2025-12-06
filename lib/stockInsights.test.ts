/**
 * Simple unit tests for stockInsights.ts
 * Run with: npx tsx lib/stockInsights.test.ts
 */

import {
  evaluateValuation,
  evaluateTrend,
  evaluateRisk,
  evaluateFundamental,
  evaluateStockInsights,
} from './stockInsights'

// Test evaluateValuation
console.log('🧪 Testing evaluateValuation...')

const valuation1 = evaluateValuation({
  price: 100000,
  eps: 8000,
  growthRate: 15,
  roe: 20,
})

console.log('Test 1 - High growth, good ROE:')
console.log('  Zone:', valuation1.zone, '-', valuation1.zoneLabel)
console.log('  Summary:', valuation1.summary)
console.log('  Fair PE:', valuation1.fairPE.toFixed(2))
console.log('  Discount:', (valuation1.discount * 100).toFixed(2) + '%')
console.log('  Score:', valuation1.score.toFixed(0))
console.log('')

const valuation2 = evaluateValuation({
  price: 150000,
  eps: 5000,
  growthRate: 5,
  roe: 12,
  peSector: 18,
})

console.log('Test 2 - Moderate growth with sector PE:')
console.log('  Zone:', valuation2.zone, '-', valuation2.zoneLabel)
console.log('  Summary:', valuation2.summary)
console.log('  Fair PE:', valuation2.fairPE.toFixed(2))
console.log('')

// Test evaluateTrend
console.log('🧪 Testing evaluateTrend...')

// Tạo dữ liệu giả lập: xu hướng tăng
const uptrendPrices = Array.from({ length: 30 }, (_, i) => 100000 + i * 1000)
const trend1 = evaluateTrend({ prices: uptrendPrices })
console.log('Test 1 - Uptrend:')
console.log('  Trend:', trend1.trend)
console.log('  Summary:', trend1.summary)
console.log('')

// Xu hướng giảm
const downtrendPrices = Array.from({ length: 30 }, (_, i) => 130000 - i * 1000)
const trend2 = evaluateTrend({ prices: downtrendPrices })
console.log('Test 2 - Downtrend:')
console.log('  Trend:', trend2.trend)
console.log('  Summary:', trend2.summary)
console.log('')

// Test evaluateRisk
console.log('🧪 Testing evaluateRisk...')

// Giá ổn định (low volatility)
const stablePrices = Array.from({ length: 30 }, () => 100000 + Math.random() * 2000)
const risk1 = evaluateRisk({ prices: stablePrices })
console.log('Test 1 - Stable prices:')
console.log('  Level:', risk1.level)
console.log('  Summary:', risk1.summary)
console.log('')

// Giá biến động mạnh (high volatility)
const volatilePrices = Array.from(
  { length: 30 },
  () => 100000 + (Math.random() - 0.5) * 20000
)
const risk2 = evaluateRisk({ prices: volatilePrices })
console.log('Test 2 - Volatile prices:')
console.log('  Level:', risk2.level)
console.log('  Summary:', risk2.summary)
console.log('')

// Test evaluateFundamental
console.log('🧪 Testing evaluateFundamental...')

const fundamental1 = evaluateFundamental({
  roe: 25,
  epsGrowth3Y: 20,
})
console.log('Test 1 - Strong growth:')
console.log('  Health:', fundamental1.health)
console.log('  Summary:', fundamental1.summary)
console.log('')

const fundamental2 = evaluateFundamental({
  roe: 15,
  epsGrowth3Y: 8,
  debtToEquity: 2.5,
})
console.log('Test 2 - High debt:')
console.log('  Health:', fundamental2.health)
console.log('  Summary:', fundamental2.summary)
console.log('')

// Test evaluateStockInsights (tổng hợp)
console.log('🧪 Testing evaluateStockInsights...')

const insights = evaluateStockInsights({
  price: 120000,
  eps: 8000,
  growthRate: 12,
  roe: 18,
  pricesHistory: Array.from({ length: 30 }, (_, i) => 100000 + i * 500),
  epsGrowth3Y: 10,
})

console.log('Full Insights:')
console.log('  Valuation:', insights.valuation.zoneLabel, '-', insights.valuation.summary)
console.log('  Trend:', insights.trend.trend, '-', insights.trend.summary)
console.log('  Risk:', insights.risk.level, '-', insights.risk.summary)
console.log('  Fundamental:', insights.fundamental.health, '-', insights.fundamental.summary)
console.log('')

console.log('✅ All tests completed!')


