// lib/evaluatePriceZones.ts

import { ShortTermAnalysis } from './analysis/shortTermEngine'

export interface PriceZones {
  shortTerm: {
    supportZone: [number, number] // [ST_low, ST_low * 1.03] in VND
    resistZone: [number, number] // [ST_high * 0.97, ST_high] in VND
    entryZone: [number, number] // [ST_support_zone[1], min(MA20, ST_resist_zone[0])] in VND
    tpZone: [number, number] // Same as resistZone
    view?: 'tăng' | 'giảm' | 'đi ngang'
    summary: string
  }
  longTerm: {
    supportZone: [number, number] // [MA200 * 0.97, MA200 * 1.03] in VND
    tpZone: [number, number] // [LT_high * 0.95, LT_high] in VND
    summary: string
  }
}

interface PriceRecord {
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

interface StockData {
  currentPrice: number // in thousands of VND
  priceHistory: PriceRecord[] // with high, low, close, volume
  volumesHistory?: number[]
  ma20: number // in VND
  ma50?: number // in VND (optional)
  shortTermAnalysis?: ShortTermAnalysis | null // Optional: use new engine if available
}

/**
 * Calculate Moving Average for prices
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  }
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/**
 * Calculate Moving Average for volumes
 */
function calculateMAVolume(volumes: number[], period: number): number {
  if (volumes.length < period) {
    return volumes.reduce((a, b) => a + b, 0) / volumes.length || 0
  }
  const recent = volumes.slice(-period)
  return recent.reduce((a, b) => a + b, 0) / recent.length
}

/**
 * Evaluate Price Zones Analysis (Refactored)
 */
export function evaluatePriceZones(stockData: StockData): PriceZones {
  const { currentPrice, priceHistory, volumesHistory, ma20, ma50, shortTermAnalysis } = stockData

  // Use ShortTermAnalysis if available (new engine)
  if (shortTermAnalysis) {
    return evaluatePriceZonesFromShortTerm(shortTermAnalysis, currentPrice, ma20, ma50)
  }

  // Fallback to original logic for backward compatibility
  // Validate data
  if (priceHistory.length < 20) {
    return {
      shortTerm: {
        supportZone: [0, 0],
        resistZone: [0, 0],
        entryZone: [0, 0],
        tpZone: [0, 0],
        summary: 'Dữ liệu giá chưa đủ để phân tích vùng giá ngắn hạn.',
      },
      longTerm: {
        supportZone: [0, 0],
        tpZone: [0, 0],
        summary: 'Dữ liệu giá chưa đủ để phân tích vùng giá dài hạn.',
      },
    }
  }

  const priceInVND = currentPrice * 1000
  const closes = priceHistory.map((r) => r.close).filter((c): c is number => c !== null && c !== undefined)

  // ============================================
  // 1) SHORT-TERM (20-30 days)
  // ============================================
  const lookbackST = Math.min(25, priceHistory.length)
  const recentST = priceHistory.slice(-lookbackST)
  const validST = recentST.filter((r) => r.high !== null && r.low !== null && r.high > 0 && r.low > 0)

  if (validST.length < 10) {
    return {
      shortTerm: {
        supportZone: [0, 0],
        resistZone: [0, 0],
        entryZone: [0, 0],
        tpZone: [0, 0],
        summary: 'Dữ liệu giá không đủ để phân tích vùng giá ngắn hạn.',
      },
      longTerm: {
        supportZone: [0, 0],
        tpZone: [0, 0],
        summary: 'Dữ liệu giá không đủ để phân tích vùng giá dài hạn.',
      },
    }
  }

  // ST_low and ST_high
  const stLows = validST.map((r) => r.low!)
  const stHighs = validST.map((r) => r.high!)
  const stLow = Math.min(...stLows)
  const stHigh = Math.max(...stHighs)

  // ST zones
  const stSupportZone: [number, number] = [stLow, stLow * 1.03]
  const stResistZone: [number, number] = [stHigh * 0.97, stHigh]

  // Calculate MA20, MA50, MA200
  const ma20Calc = ma20 > 0 ? ma20 : calculateMA(closes, 20)
  const ma50Calc = ma50 && ma50 > 0 ? ma50 : calculateMA(closes, 50)
  const ma200Calc = calculateMA(closes, 200)

  // Volume ratio
  let volumeRatio = 1.0
  if (volumesHistory && volumesHistory.length >= 20) {
    const ma20Volume = calculateMAVolume(volumesHistory, 20)
    const volumeToday = volumesHistory[volumesHistory.length - 1]
    if (ma20Volume > 0) {
      volumeRatio = volumeToday / ma20Volume
    }
  }

  // Entry zone validation
  const priceAboveSupport = priceInVND >= stSupportZone[1] && priceInVND <= stSupportZone[1] * 1.04
  const priceAboveMA200 = priceInVND >= ma200Calc
  const volumeOk = volumeRatio >= 0.8 && volumeRatio <= 1.8

  // ST Entry Zone
  const entryLower = stSupportZone[1]
  const entryUpper = Math.min(ma20Calc, stResistZone[0])
  const stEntryZone: [number, number] = [entryLower, entryUpper]

  // ST TP Zone
  const stTpZone: [number, number] = [...stResistZone]

  // Determine view (tăng/giảm/đi ngang)
  const roc10 = closes.length >= 10 ? (closes[closes.length - 1] - closes[closes.length - 10]) / closes[closes.length - 10] : 0
  let view: 'tăng' | 'giảm' | 'đi ngang' = 'đi ngang'
  if (roc10 > 0.03) view = 'tăng'
  else if (roc10 < -0.03) view = 'giảm'

  // Generate short-term summary
  const stSummary = generateShortTermSummary(
    priceInVND,
    stSupportZone,
    stResistZone,
    stEntryZone,
    priceAboveSupport,
    priceAboveMA200,
    volumeOk,
    view
  )

  // ============================================
  // 2) LONG-TERM (MA200, 52-week)
  // ============================================
  // 52-week high/low (or last 200 days if available)
  const lookbackLT = Math.min(200, priceHistory.length)
  const recentLT = priceHistory.slice(-lookbackLT)
  const validLT = recentLT.filter((r) => r.high !== null && r.low !== null && r.high > 0 && r.low > 0)

  let ltLow = ma200Calc * 0.9 // fallback
  let ltHigh = ma200Calc * 1.1 // fallback

  if (validLT.length >= 50) {
    const ltLows = validLT.map((r) => r.low!)
    const ltHighs = validLT.map((r) => r.high!)
    ltLow = Math.min(...ltLows)
    ltHigh = Math.max(...ltHighs)
  }

  // LT zones
  const ltSupportZone: [number, number] = [ma200Calc * 0.97, ma200Calc * 1.03]
  const ltTpZone: [number, number] = [ltHigh * 0.95, ltHigh]

  // Generate long-term summary
  const ltSummary = generateLongTermSummary(priceInVND, ltSupportZone, ltTpZone, ma200Calc)

  return {
    shortTerm: {
      supportZone: stSupportZone,
      resistZone: stResistZone,
      entryZone: stEntryZone,
      tpZone: stTpZone,
      view,
      summary: stSummary,
    },
    longTerm: {
      supportZone: ltSupportZone,
      tpZone: ltTpZone,
      summary: ltSummary,
    },
  }
}

function generateShortTermSummary(
  currentPrice: number,
  supportZone: [number, number],
  resistZone: [number, number],
  entryZone: [number, number],
  priceAboveSupport: boolean,
  priceAboveMA200: boolean,
  volumeOk: boolean,
  view: 'tăng' | 'giảm' | 'đi ngang'
): string {
  if (priceAboveSupport && priceAboveMA200 && volumeOk) {
    return `Ngắn hạn: Giá đang ở gần vùng hỗ trợ 20 phiên, phù hợp quan sát để tìm điểm vào lệnh nếu xuất hiện tín hiệu tăng rõ hơn.`
  } else if (view === 'tăng') {
    return `Ngắn hạn: Giá đang có xu hướng tăng, nhưng cần đợi giá điều chỉnh về vùng hỗ trợ để có điểm vào lệnh tốt hơn.`
  } else if (view === 'giảm') {
    return `Ngắn hạn: Giá đang có xu hướng giảm, nên chờ đợi giá ổn định ở vùng hỗ trợ trước khi cân nhắc vào lệnh.`
  } else {
    return `Ngắn hạn: Giá đang đi ngang, chưa có xu hướng rõ ràng. Nên quan sát thêm để tìm điểm vào lệnh phù hợp.`
  }
}

function generateLongTermSummary(
  currentPrice: number,
  supportZone: [number, number],
  tpZone: [number, number],
  ma200: number
): string {
  const distToMA200 = ((currentPrice - ma200) / ma200) * 100

  if (Math.abs(distToMA200) < 3) {
    return `Dài hạn: Giá đang dao động quanh đường MA200, đây là vùng nhiều nhà đầu tư dài hạn dùng để tích lũy.`
  } else if (distToMA200 > 0) {
    return `Dài hạn: Giá đang ở trên MA200, cho thấy xu hướng tăng dài hạn. Có thể cân nhắc tích lũy khi giá điều chỉnh về gần MA200.`
  } else {
    return `Dài hạn: Giá đang ở dưới MA200, xu hướng dài hạn chưa rõ ràng. Nên thận trọng và chờ tín hiệu tích cực hơn.`
  }
}

/**
 * Evaluate Price Zones using ShortTermAnalysis (new engine)
 */
function evaluatePriceZonesFromShortTerm(
  shortTerm: ShortTermAnalysis,
  currentPrice: number,
  ma20: number,
  ma50?: number
): PriceZones {
  const priceInVND = currentPrice * 1000

  // Short-term zones from ShortTermAnalysis
  const shortTermZones = {
    supportZone: shortTerm.supportZone,
    resistZone: shortTerm.resistZone,
    entryZone: shortTerm.pullbackZone || shortTerm.breakoutZone || shortTerm.supportZone,
    tpZone: shortTerm.tpZoneShort || shortTerm.resistZone,
    view: shortTerm.trendMode === 'UP' ? ('tăng' as const) : shortTerm.trendMode === 'DOWN' ? ('giảm' as const) : ('đi ngang' as const),
    summary: generateShortTermSummaryFromShortTerm(shortTerm, priceInVND),
  }

  // Long-term zones (still use MA200 logic, but can be enhanced later)
  const ma200 = ma20 * 1.1 // Approximate, would need actual MA200 from indicators
  const longTermZones = {
    supportZone: [ma200 * 0.97, ma200 * 1.03] as [number, number],
    tpZone: [shortTerm.resistZone[1] * 0.95, shortTerm.resistZone[1]] as [number, number],
    summary: generateLongTermSummaryFromShortTerm(shortTerm, ma200),
  }

  return {
    shortTerm: shortTermZones,
    longTerm: longTermZones,
  }
}

function generateShortTermSummaryFromShortTerm(shortTerm: ShortTermAnalysis, currentPrice: number): string {
  if (shortTerm.trendMode === 'UP') {
    if (shortTerm.signals.hasPullbackLongSetup) {
      return 'Xu hướng tăng đang hình thành, giá đang trong vùng pullback → cơ hội tích lũy.'
    }
    return 'Xu hướng tăng ngắn hạn đang diễn ra, giá nằm trên MA20 và MA20 > MA50.'
  } else if (shortTerm.trendMode === 'DOWN') {
    return 'Xu hướng giảm ngắn hạn đang diễn ra, cần thận trọng.'
  } else {
    return 'Giá đang đi ngang, chưa có xu hướng rõ ràng trong ngắn hạn.'
  }
}

function generateLongTermSummaryFromShortTerm(shortTerm: ShortTermAnalysis, ma200: number): string {
  // This is a simplified version, can be enhanced with actual MA200 data
  if (shortTerm.trendMode === 'UP') {
    return `Dài hạn: Giá đang ở trên MA200, cho thấy xu hướng tăng dài hạn. Có thể cân nhắc tích lũy khi giá điều chỉnh về gần MA200.`
  } else {
    return `Dài hạn: Giá đang ở dưới MA200, xu hướng dài hạn chưa rõ ràng. Nên thận trọng và chờ tín hiệu tích cực hơn.`
  }
}
