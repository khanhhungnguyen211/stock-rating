// lib/analysis/shortTermAdapter.ts

/**
 * Adapter to convert existing data formats to ShortTermAnalysis
 * and provide integration points for existing code
 */

import { evaluateShortTermAnalysis, type DailyBar, type ShortTermAnalysis } from './shortTermEngine'
import { VnstockPriceRecord } from '../vnstockClient'

/**
 * Convert VnstockPriceRecord to DailyBar format
 */
export function convertToDailyBar(records: VnstockPriceRecord[]): DailyBar[] {
  return records
    .filter((r) => r.close !== null && r.high !== null && r.low !== null && r.open !== null)
    .map((r) => ({
      date: r.date,
      open: r.open!,
      high: r.high!,
      low: r.low!,
      close: r.close!,
      volume: r.volume || 0,
    }))
}

/**
 * Convert price history arrays to DailyBar format (for mock data)
 */
export function convertPriceHistoryToDailyBar(
  prices: number[],
  volumes: number[],
  dates?: string[]
): DailyBar[] {
  return prices.map((close, index) => {
    const volatility = close * 0.02 // 2% volatility for mock data
    const high = close + volatility * (0.5 + Math.random() * 0.5)
    const low = close - volatility * (0.5 + Math.random() * 0.5)
    const open = index > 0 ? prices[index - 1] : close

    return {
      date: dates?.[index] || `Day ${index}`,
      open,
      high,
      low,
      close,
      volume: volumes[index] || 0,
    }
  })
}

/**
 * Evaluate short-term analysis from VnstockPriceRecord
 */
export function evaluateShortTermFromVnstock(
  records: VnstockPriceRecord[]
): ShortTermAnalysis | null {
  try {
    if (!records || records.length === 0) {
      return null
    }
    const dailyBars = convertToDailyBar(records)
    if (dailyBars.length < 20) {
      return null // Not enough data
    }
    return evaluateShortTermAnalysis(dailyBars)
  } catch (error) {
    console.error('Error evaluating short-term analysis from vnstock:', error)
    return null
  }
}

/**
 * Evaluate short-term analysis from price/volume arrays
 */
export function evaluateShortTermFromArrays(
  prices: number[],
  volumes: number[],
  dates?: string[]
): ShortTermAnalysis | null {
  try {
    if (!prices || prices.length < 20 || !volumes || volumes.length < 20) {
      return null // Not enough data
    }
    const dailyBars = convertPriceHistoryToDailyBar(prices, volumes, dates)
    if (dailyBars.length < 20) {
      return null
    }
    return evaluateShortTermAnalysis(dailyBars)
  } catch (error) {
    console.error('Error evaluating short-term analysis from arrays:', error)
    return null
  }
}

