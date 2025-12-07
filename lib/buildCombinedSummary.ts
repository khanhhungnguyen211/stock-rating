// lib/buildCombinedSummary.ts

import { AiInsight } from './evaluateAiInsight'
import { SafeBuyZone, SafetyLevel } from './evaluateSafeBuyZone'
import { PriceZones } from './evaluatePriceZones'
import { TrendInsight } from './stockInsights'

export interface CombinedSummary {
  headlineShort: string
  headlineLong?: string
  entryZone: { from: number; to: number } | null
  tpZone: { from: number; to: number } | null
  safetyTag: 'safe' | 'watch' | 'unsafe'
  bullets: string[]
  suggestion: string
  knowledge: string
}

/**
 * Format percentage with max 1 decimal, clamp if > 1000%
 */
function formatPercentage(value: number): string {
  if (Math.abs(value) > 1000) {
    return value > 0 ? '> 1000%' : '< -1000%'
  }
  return value.toFixed(1)
}

/**
 * Fix percentage formatting in text (clamp > 1000%)
 */
function fixPercentageInText(text: string): string {
  // Match patterns like "99384.4%" or "123.45%"
  return text.replace(/(\d+\.?\d*)%/g, (match, numStr) => {
    const num = parseFloat(numStr)
    if (Math.abs(num) > 1000) {
      return num > 0 ? '> 1000%' : '< -1000%'
    }
    return `${parseFloat(numStr).toFixed(1)}%`
  })
}

/**
 * Build combined summary from AI Insight, Safe Buy Zone, and Price Zones
 */
export function buildCombinedSummary(
  aiInsight: AiInsight,
  safeZone: SafeBuyZone,
  priceZones: PriceZones,
  trend: TrendInsight
): CombinedSummary {
  // 1) headlineShort: rút gọn từ aiInsight.conclusion, loại bỏ "Ngắn hạn", nếu |roc10| < 1% thì coi là "đi ngang"
  let headlineShort = aiInsight.conclusion
    .replace(/ngắn hạn/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Nếu |roc10| < 1%, điều chỉnh headline để nói "đi ngang"
  if (Math.abs(trend.roc10) < 1) {
    headlineShort = headlineShort.replace(/tăng|giảm/gi, 'đi ngang')
  }

  // 2) headlineLong = longTerm summary từ priceZones
  const headlineLong = priceZones.longTerm.summary || undefined

  // 3) entryZone = priceZones.shortTerm.entryZone
  const entryZone =
    priceZones.shortTerm.entryZone[0] > 0 && priceZones.shortTerm.entryZone[1] > 0
      ? {
          from: priceZones.shortTerm.entryZone[0],
          to: priceZones.shortTerm.entryZone[1],
        }
      : null

  // 4) tpZone = priceZones.shortTerm.tpZone
  const tpZone =
    priceZones.shortTerm.tpZone[0] > 0 && priceZones.shortTerm.tpZone[1] > 0
      ? {
          from: priceZones.shortTerm.tpZone[0],
          to: priceZones.shortTerm.tpZone[1],
        }
      : null

  // 5) safetyTag = safeZone.safetyLevel
  const safetyTag = safeZone.safetyLevel

  // 6) bullets: tối đa 3 ý quan trọng (xu hướng, vùng giá, khối lượng)
  const bullets: string[] = []

  // Bullet 1: Xu hướng (ROC10 / vị trí so với MA20)
  if (Math.abs(trend.roc10) < 1) {
    bullets.push(`ROC10 ≈ ${formatPercentage(trend.roc10)}% → giá gần như đi ngang trong ngắn hạn.`)
  } else {
    const rocSign = trend.roc10 >= 0 ? '+' : ''
    bullets.push(`ROC10 = ${rocSign}${formatPercentage(trend.roc10)}% → ${
      trend.roc10 > 0 ? 'giá có đà tăng' : 'giá có đà giảm'
    } trong ngắn hạn.`)
  }

  // Bullet 2: Vùng giá (support/resist short-term)
  if (priceZones.shortTerm.supportZone[0] > 0 && priceZones.shortTerm.resistZone[0] > 0) {
    const supportLow = priceZones.shortTerm.supportZone[0].toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const resistHigh = priceZones.shortTerm.resistZone[1].toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    bullets.push(`Vùng hỗ trợ: ${supportLow} VND, vùng kháng cự: ${resistHigh} VND.`)
  }

  // Bullet 3: Khối lượng (volumeRatio từ safeZone.reasons)
  const volumeReason = safeZone.reasons.find((r) => r.includes('Khối lượng') || r.includes('khối lượng'))
  if (volumeReason) {
    // Rút gọn reason về khối lượng
    const volumeText = volumeReason
      .replace(/Khối lượng giao dịch/gi, 'Khối lượng')
      .replace(/gần đây/gi, '')
      .trim()
    bullets.push(volumeText)
  } else if (safeZone.reasons.length > 0) {
    // Fallback: lấy reason đầu tiên về MA20 nếu có
    const ma20Reason = safeZone.reasons.find((r) => r.includes('MA20'))
    if (ma20Reason) {
      bullets.push(ma20Reason)
    }
  }

  // Đảm bảo có ít nhất 2 bullets
  if (bullets.length === 0) {
    bullets.push('Dữ liệu đang được phân tích để đưa ra nhận định.')
  }

  // 7) suggestion: ưu tiên safeZone.suggestion, nếu không có thì dùng aiInsight.suggestion
  const suggestion = safeZone.suggestion || aiInsight.suggestion

  // 8) knowledge: giữ nguyên aiInsight.knowledge, fix format % nếu > 1000%
  const knowledge = fixPercentageInText(aiInsight.knowledge)

  return {
    headlineShort,
    headlineLong,
    entryZone,
    tpZone,
    safetyTag,
    bullets,
    suggestion,
    knowledge,
  }
}

