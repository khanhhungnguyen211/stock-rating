// lib/evaluateSafeBuyZone.ts

import { ShortTermAnalysis } from './analysis/shortTermEngine'

export type SafetyLevel = 'safe' | 'watch' | 'unsafe'

export interface SafeBuyZone {
  zone: [number, number] // [LowerBound, UpperBound] in VND
  safetyLevel: SafetyLevel
  reasons: string[]
  suggestion: string
}

interface StockData {
  currentPrice: number // in thousands of VND
  pricesHistory: number[] // in VND
  volumesHistory?: number[]
  ma20: number // in VND
  shortTermAnalysis?: ShortTermAnalysis | null // Optional: use new engine if available
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
 * Evaluate Safe Buy Zone based on technical analysis
 */
export function evaluateSafeBuyZone(stockData: StockData): SafeBuyZone {
  const { currentPrice, pricesHistory, volumesHistory, ma20, shortTermAnalysis } = stockData

  // Use ShortTermAnalysis if available (new engine)
  if (shortTermAnalysis) {
    return evaluateSafeBuyZoneFromShortTerm(shortTermAnalysis, currentPrice)
  }

  // Fallback to original logic for backward compatibility
  // Validate data
  if (pricesHistory.length < 20) {
    return {
      zone: [0, 0],
      safetyLevel: 'unsafe',
      reasons: ['Dữ liệu giá chưa đủ 20 phiên để tính toán vùng giá an toàn.'],
      suggestion: 'Cần thêm dữ liệu lịch sử giá để đánh giá vùng giá an toàn.',
    }
  }

  // 1) Compute Support20 = lowest price of last 20 days
  const recent20Prices = pricesHistory.slice(-20)
  const support20 = Math.min(...recent20Prices)

  // 2) Compute LowerBound and UpperBound
  const lowerBound = support20 * 1.01 // 1% above support
  const upperBound = support20 * 1.03 // 3% above support

  // 3) Compute VolRatio = volume_today / MA20Volume
  let volRatio = 1.0
  if (volumesHistory && volumesHistory.length >= 20) {
    const ma20Volume = calculateMAVolume(volumesHistory, 20)
    const volumeToday = volumesHistory[volumesHistory.length - 1]
    if (ma20Volume > 0) {
      volRatio = volumeToday / ma20Volume
    }
  }

  // 4) Compute distMA20 = (price_today - MA20) / MA20
  const priceInVND = currentPrice * 1000
  const distMA20 = ma20 > 0 ? (priceInVND - ma20) / ma20 : 0

  // 5) Determine safety level
  const inZone = priceInVND >= lowerBound && priceInVND <= upperBound
  const volOk = volRatio >= 0.8 && volRatio <= 1.5
  const ma20Ok = Math.abs(distMA20) < 0.03 // within 3% of MA20

  let safetyLevel: SafetyLevel
  let conditionsMet = 0

  if (inZone) conditionsMet++
  if (volOk) conditionsMet++
  if (ma20Ok) conditionsMet++

  if (conditionsMet === 3) {
    safetyLevel = 'safe'
  } else if (conditionsMet >= 1) {
    safetyLevel = 'watch'
  } else {
    safetyLevel = 'unsafe'
  }

  // 6) Generate reasons
  const reasons = generateReasons(
    inZone,
    volOk,
    ma20Ok,
    lowerBound,
    upperBound,
    volRatio,
    distMA20,
    support20
  )

  // 7) Generate suggestion
  const suggestion = generateSuggestion(safetyLevel, inZone, volOk, ma20Ok)

  return {
    zone: [lowerBound, upperBound],
    safetyLevel,
    reasons,
    suggestion,
  }
}

function generateReasons(
  inZone: boolean,
  volOk: boolean,
  ma20Ok: boolean,
  lowerBound: number,
  upperBound: number,
  volRatio: number,
  distMA20: number,
  support20: number
): string[] {
  const reasons: string[] = []

  if (inZone) {
    reasons.push(
      `Giá đang ở trong vùng an toàn (${lowerBound.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} - ${upperBound.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND), gần vùng hỗ trợ 20 ngày.`
    )
  } else {
    const priceInZone = lowerBound + (upperBound - lowerBound) / 2
    const distToZone = Math.abs(priceInZone - (lowerBound + upperBound) / 2) / priceInZone
    if (distToZone < 0.05) {
      reasons.push('Giá đang gần vùng hỗ trợ 20 ngày, nhưng chưa vào vùng an toàn.')
    } else {
      reasons.push(
        `Giá hiện tại cách xa vùng hỗ trợ 20 ngày (${support20.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND), chưa phải thời điểm an toàn.`
      )
    }
  }

  if (volOk) {
    reasons.push(
      `Khối lượng giao dịch ổn định (${(volRatio * 100).toFixed(0)}% so với trung bình) cho thấy thị trường không bị bán tháo.`
    )
  } else {
    if (volRatio > 1.5) {
      reasons.push(
        `Khối lượng giao dịch cao bất thường (${(volRatio * 100).toFixed(0)}% so với trung bình) có thể là dấu hiệu biến động mạnh.`
      )
    } else {
      reasons.push(
        `Khối lượng giao dịch thấp (${(volRatio * 100).toFixed(0)}% so với trung bình) cho thấy thị trường đang chờ đợi.`
      )
    }
  }

  if (ma20Ok) {
    reasons.push(
      `Giá không cách MA20 quá xa (${(Math.abs(distMA20) * 100).toFixed(1)}%) nên ít rủi ro mua đuổi.`
    )
  } else {
    const direction = distMA20 > 0 ? 'trên' : 'dưới'
    reasons.push(
      `Giá đang ở ${direction} MA20 khá xa (${(Math.abs(distMA20) * 100).toFixed(1)}%), cần thận trọng.`
    )
  }

  return reasons
}

function generateSuggestion(
  safetyLevel: SafetyLevel,
  inZone: boolean,
  volOk: boolean,
  ma20Ok: boolean
): string {
  if (safetyLevel === 'safe') {
    return 'Đây là vùng giá tương đối an toàn để cân nhắc mua vào, nhưng vẫn nên phân tích thêm về tình hình doanh nghiệp và thị trường tổng thể trước khi quyết định.'
  } else if (safetyLevel === 'watch') {
    if (!inZone) {
      return 'Giá chưa vào vùng an toàn, bạn nên chờ đợi giá điều chỉnh về gần vùng hỗ trợ trước khi cân nhắc mua vào.'
    } else if (!volOk) {
      return 'Giá đang trong vùng an toàn nhưng khối lượng giao dịch chưa ổn định, nên theo dõi thêm vài phiên để xác nhận xu hướng.'
    } else {
      return 'Giá đang gần vùng an toàn nhưng chưa đáp ứng đủ điều kiện, bạn nên kiên nhẫn chờ đợi thêm tín hiệu rõ ràng hơn.'
    }
  } else {
    return 'Hiện tại không phải thời điểm an toàn để mua vào. Bạn nên chờ đợi giá điều chỉnh về vùng hỗ trợ hoặc có tín hiệu tích cực hơn từ thị trường.'
  }
}

/**
 * Evaluate Safe Buy Zone using ShortTermAnalysis (new engine)
 */
function evaluateSafeBuyZoneFromShortTerm(
  shortTerm: ShortTermAnalysis,
  currentPrice: number
): SafeBuyZone {
  const priceInVND = currentPrice * 1000

  // Use pullbackZone if available and valid, otherwise use supportZone
  let zone: [number, number]
  if (shortTerm.pullbackZone && shortTerm.trendMode === 'UP') {
    zone = shortTerm.pullbackZone
  } else {
    zone = shortTerm.supportZone
  }

  // Map riskLevel to safetyLevel
  const safetyLevel: SafetyLevel =
    shortTerm.riskLevel === 'LOW' ? 'safe' : shortTerm.riskLevel === 'HIGH' ? 'unsafe' : 'watch'

  // Generate reasons
  const reasons: string[] = []
  if (shortTerm.signals.hasPullbackLongSetup) {
    reasons.push('Giá đang trong vùng pullback (quanh MA20) trong xu hướng tăng → cơ hội tích lũy.')
  } else if (shortTerm.signals.isNearSupport) {
    reasons.push(`Giá đang gần vùng hỗ trợ (${shortTerm.supportZone[1].toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND) → có thể có lực mua.`)
  }

  if (shortTerm.volumeMode === 'NORMAL' || shortTerm.volumeMode === 'LOW') {
    reasons.push('Khối lượng giao dịch ở mức bình thường → không có áp lực bán mạnh.')
  }

  const distToZone = Math.abs(priceInVND - zone[1]) / zone[1]
  if (distToZone < 0.03) {
    reasons.push(`Giá đang trong vùng an toàn (cách vùng hỗ trợ < 3%) → ít rủi ro.`)
  }

  // Generate suggestion
  let suggestion: string
  if (safetyLevel === 'safe') {
    suggestion =
      'Vùng giá hiện tại tương đối an toàn để cân nhắc tích lũy, nhưng nên tìm hiểu thêm về công ty và phân tích kỹ trước khi quyết định.'
  } else if (safetyLevel === 'watch') {
    suggestion =
      'Cần theo dõi thêm vài phiên để xem giá có giữ được ở vùng hỗ trợ không, tránh vội vàng vào lệnh.'
  } else {
    suggestion =
      'Rủi ro cao, nên chờ đợi và theo dõi thêm để xem xu hướng có đảo chiều không, tránh quyết định vội vàng.'
  }

  return {
    zone,
    safetyLevel,
    reasons,
    suggestion,
  }
}

