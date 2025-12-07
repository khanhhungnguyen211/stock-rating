// lib/evaluateAiInsight.ts

import { TrendInsight, RiskInsight } from './stockInsights'
import { ShortTermAnalysis } from './analysis/shortTermEngine'

export interface AiInsight {
  conclusion: string
  reasons: string[]
  suggestion: string
  knowledge: string
}

interface StockData {
  currentPrice: number
  trend: TrendInsight
  risk: RiskInsight
  volumesHistory?: number[]
  shortTermAnalysis?: ShortTermAnalysis | null // Optional: use new engine if available
}

/**
 * Evaluate AI Insight for beginners
 * Generates easy-to-understand analysis from technical indicators
 */
export function evaluateAiInsight(stockData: StockData): AiInsight {
  const { currentPrice, trend, risk, volumesHistory, shortTermAnalysis } = stockData

  // Use ShortTermAnalysis if available (new engine), otherwise fallback to ROC-based logic
  if (shortTermAnalysis) {
    return evaluateAiInsightFromShortTerm(shortTermAnalysis, currentPrice)
  }

  // Fallback to ROC-based logic for backward compatibility
  // Determine direction and strength
  const direction = getDirection(trend)
  const strength = getStrength(trend, risk)

  // Generate conclusion (1 sentence)
  const conclusion = generateConclusion(direction, strength, trend)

  // Generate reasons (2-3 bullets with numbers + meaning)
  const reasons = generateReasons(trend, risk, currentPrice, volumesHistory)

  // Generate suggestion (1-2 sentences, safe + beginner friendly)
  const suggestion = generateSuggestion(direction, strength, risk)

  // Generate knowledge (explain one term)
  const knowledge = generateKnowledge(trend, risk)

  return {
    conclusion,
    reasons,
    suggestion,
    knowledge,
  }
}

/**
 * Evaluate AI Insight using ShortTermAnalysis (new engine)
 */
function evaluateAiInsightFromShortTerm(
  shortTerm: ShortTermAnalysis,
  currentPrice: number
): AiInsight {
  // Map trendMode to direction
  const direction =
    shortTerm.trendMode === 'UP' ? 'tăng' : shortTerm.trendMode === 'DOWN' ? 'giảm' : 'đi ngang'

  // Map volatility to strength
  const strength =
    shortTerm.volatility === 'LOW' && shortTerm.trendMode === 'UP'
      ? 'mạnh'
      : shortTerm.volatility === 'MEDIUM'
      ? 'vừa'
      : 'yếu'

  // Generate conclusion based on ShortTermAnalysis
  const conclusion = generateConclusionFromShortTerm(shortTerm)

  // Generate reasons based on ShortTermAnalysis
  const reasons = generateReasonsFromShortTerm(shortTerm, currentPrice)

  // Generate suggestion based on ShortTermAnalysis
  const suggestion = generateSuggestionFromShortTerm(shortTerm)

  // Generate knowledge based on ShortTermAnalysis
  const knowledge = generateKnowledgeFromShortTerm(shortTerm)

  return {
    conclusion,
    reasons,
    suggestion,
    knowledge,
  }
}

function generateConclusionFromShortTerm(shortTerm: ShortTermAnalysis): string {
  if (shortTerm.trendMode === 'UP') {
    if (shortTerm.volatility === 'LOW') {
      return 'Cổ phiếu đang trong xu hướng tăng với biến động thấp, tín hiệu tích cực.'
    } else if (shortTerm.volatility === 'MEDIUM') {
      return 'Cổ phiếu đang trong xu hướng tăng với biến động trung bình, cần theo dõi.'
    } else {
      return 'Cổ phiếu có xu hướng tăng nhưng biến động cao, cần thận trọng.'
    }
  } else if (shortTerm.trendMode === 'DOWN') {
    return 'Cổ phiếu đang trong xu hướng giảm, cần thận trọng khi quyết định.'
  } else {
    return 'Cổ phiếu đang đi ngang, chưa có xu hướng rõ ràng.'
  }
}

function generateReasonsFromShortTerm(shortTerm: ShortTermAnalysis, currentPrice: number): string[] {
  const reasons: string[] = []

  // Reason 1: Trend and MA position
  const priceInVND = currentPrice * 1000
  const distToSupport = ((priceInVND - shortTerm.supportZone[1]) / shortTerm.supportZone[1]) * 100
  const distToResist = ((priceInVND - shortTerm.resistZone[0]) / shortTerm.resistZone[0]) * 100

  if (shortTerm.trendMode === 'UP') {
    reasons.push(
      `Xu hướng tăng đang hình thành: giá nằm trên MA20, MA20 > MA50, và MA20 đang tăng.`
    )
  } else if (shortTerm.trendMode === 'DOWN') {
    reasons.push(
      `Xu hướng giảm đang diễn ra: giá nằm dưới MA20, MA20 < MA50, và MA20 đang giảm.`
    )
  } else {
    reasons.push(`Giá đang dao động quanh MA20, xu hướng chưa rõ ràng.`)
  }

  // Reason 2: Support/Resistance position
  if (Math.abs(distToSupport) < 2) {
    reasons.push(
      `Giá đang gần vùng hỗ trợ (${shortTerm.supportZone[1].toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND) → có thể có lực mua.`
    )
  } else if (Math.abs(distToResist) < 2) {
    reasons.push(
      `Giá đang gần vùng kháng cự (${shortTerm.resistZone[0].toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND) → cần theo dõi.`
    )
  }

  // Reason 3: Volume
  if (shortTerm.volumeMode === 'HIGH') {
    reasons.push('Khối lượng giao dịch tăng mạnh → lực mua/bán đang tăng.')
  } else if (shortTerm.volumeMode === 'LOW') {
    reasons.push('Khối lượng giao dịch thấp → lực mua/bán chưa mạnh.')
  }

  return reasons
}

function generateSuggestionFromShortTerm(shortTerm: ShortTermAnalysis): string {
  if (shortTerm.riskLevel === 'LOW' && shortTerm.signals.hasPullbackLongSetup) {
    return 'Có thể cân nhắc tích lũy khi giá điều chỉnh về vùng pullback, nhưng nên tìm hiểu thêm về công ty trước.'
  } else if (shortTerm.riskLevel === 'HIGH') {
    return 'Rủi ro cao, nên chờ đợi và theo dõi thêm để xem xu hướng có rõ ràng hơn không.'
  } else if (shortTerm.trendMode === 'UP') {
    return 'Có thể theo dõi thêm vài phiên để xem xu hướng có duy trì không, nhưng đừng vội vàng vào lệnh.'
  } else {
    return 'Nên kiên nhẫn chờ đợi xu hướng rõ ràng hơn trước khi đưa ra quyết định.'
  }
}

function generateKnowledgeFromShortTerm(shortTerm: ShortTermAnalysis): string {
  if (shortTerm.signals.isNearSupport || shortTerm.signals.isNearResistance) {
    return 'Vùng hỗ trợ là mức giá mà nhiều người mua sẵn sàng vào lệnh, thường làm giá tăng lại. Vùng kháng cự là mức giá mà nhiều người bán sẵn sàng bán, thường làm giá giảm lại.'
  } else if (shortTerm.volumeMode === 'HIGH') {
    return 'Khối lượng giao dịch cao thường đi kèm với xu hướng mạnh. Khi giá tăng kèm khối lượng cao, đó là tín hiệu tích cực. Ngược lại, giá giảm kèm khối lượng cao là tín hiệu tiêu cực.'
  } else {
    return 'MA20 (Moving Average 20 ngày) là giá trung bình trong 20 phiên gần nhất. Khi giá nằm trên MA20 và MA20 đang tăng, thường cho thấy xu hướng tăng đang hình thành.'
  }
}

function getDirection(trend: TrendInsight): 'tăng' | 'giảm' | 'đi ngang' {
  if (trend.trend === 'uptrend') return 'tăng'
  if (trend.trend === 'downtrend') return 'giảm'
  return 'đi ngang'
}

function getStrength(trend: TrendInsight, risk: RiskInsight): 'mạnh' | 'vừa' | 'yếu' {
  const absRoc = Math.abs(trend.roc10)
  const volatility = risk.volatility20

  if (absRoc > 5 && volatility < 3) return 'mạnh'
  if (absRoc > 2 && volatility < 5) return 'vừa'
  return 'yếu'
}

function generateConclusion(
  direction: 'tăng' | 'giảm' | 'đi ngang',
  strength: 'mạnh' | 'vừa' | 'yếu',
  trend: TrendInsight
): string {
  if (direction === 'tăng') {
    if (strength === 'mạnh') {
      return 'Cổ phiếu hiện đang trong xu hướng tăng mạnh và có đà tăng tốt.'
    } else if (strength === 'vừa') {
      return 'Cổ phiếu hiện đang trong xu hướng tăng nhẹ, nhưng lực tăng chưa thực sự mạnh.'
    } else {
      return 'Cổ phiếu có dấu hiệu tăng nhẹ, nhưng xu hướng chưa rõ ràng và cần theo dõi thêm.'
    }
  } else if (direction === 'giảm') {
    if (strength === 'mạnh') {
      return 'Cổ phiếu hiện đang trong xu hướng giảm mạnh, cần thận trọng khi quyết định.'
    } else if (strength === 'vừa') {
      return 'Cổ phiếu đang có xu hướng giảm nhẹ, nhưng chưa phải là tín hiệu báo động.'
    } else {
      return 'Cổ phiếu có dấu hiệu giảm nhẹ, nhưng xu hướng chưa rõ ràng và cần theo dõi thêm.'
    }
  } else {
    return 'Cổ phiếu hiện đang đi ngang, chưa có xu hướng rõ ràng về tăng hay giảm.'
  }
}

function generateReasons(
  trend: TrendInsight,
  risk: RiskInsight,
  currentPrice: number,
  volumesHistory?: number[]
): string[] {
  const reasons: string[] = []

  // ROC10 reason
  const rocSign = trend.roc10 >= 0 ? '+' : ''
  reasons.push(
    `ROC10 = ${rocSign}${trend.roc10.toFixed(1)}% → ${
      trend.roc10 > 0
        ? 'giá có đà tăng trong ngắn hạn'
        : trend.roc10 < 0
        ? 'giá có đà giảm trong ngắn hạn'
        : 'giá gần như đi ngang'
    }.`
  )

  // MA20 reason
  const priceInVND = currentPrice * 1000
  const distToMA20 = ((priceInVND - trend.ma20) / trend.ma20) * 100
  const distSign = distToMA20 >= 0 ? 'trên' : 'dưới'
  reasons.push(
    `Giá nằm ${distSign} MA20 khoảng ${Math.abs(distToMA20).toFixed(1)}% → ${
      distToMA20 > 2
        ? 'xu hướng tăng đã hình thành'
        : distToMA20 < -2
        ? 'xu hướng giảm đang diễn ra'
        : 'xu hướng chưa rõ ràng'
    }.`
  )

  // Volume reason (if available)
  if (volumesHistory && volumesHistory.length >= 20) {
    const recentVolumes = volumesHistory.slice(-20)
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
    const lastVolume = volumesHistory[volumesHistory.length - 1]
    const volumeRatio = lastVolume / avgVolume

    if (volumeRatio > 1.2) {
      reasons.push('Khối lượng giao dịch tăng mạnh gần đây → lực mua/bán đang tăng.')
    } else if (volumeRatio < 0.8) {
      reasons.push('Khối lượng giao dịch thấp hơn trung bình → lực mua/bán chưa mạnh.')
    }
  } else {
    // Volatility reason as fallback
    reasons.push(
      `Độ biến động ${risk.volatility20.toFixed(1)}%/ngày → ${
        risk.volatility20 > 4
          ? 'rủi ro cao, giá dao động mạnh'
          : risk.volatility20 > 2
          ? 'rủi ro trung bình'
          : 'rủi ro thấp, giá ổn định'
      }.`
    )
  }

  return reasons
}

function generateSuggestion(
  direction: 'tăng' | 'giảm' | 'đi ngang',
  strength: 'mạnh' | 'vừa' | 'yếu',
  risk: RiskInsight
): string {
  if (direction === 'tăng' && strength === 'mạnh') {
    return 'Bạn có thể theo dõi thêm vài phiên để xem xu hướng có duy trì không, nhưng đừng vội vàng vào lệnh mà hãy tìm hiểu thêm về công ty trước.'
  } else if (direction === 'tăng' && strength === 'vừa') {
    return 'Bạn có thể theo dõi thêm vài phiên để xem xu hướng có rõ ràng hơn không, thay vì vội vàng vào lệnh.'
  } else if (direction === 'giảm') {
    return 'Nên chờ đợi và theo dõi thêm để xem xu hướng có đảo chiều không, tránh quyết định vội vàng khi giá đang giảm.'
  } else {
    return 'Thị trường đang đi ngang, bạn nên kiên nhẫn chờ đợi xu hướng rõ ràng hơn trước khi đưa ra quyết định.'
  }
}

function generateKnowledge(trend: TrendInsight, risk: RiskInsight): string {
  // Pick the most relevant concept based on current data
  const concepts = [
    {
      term: 'MA20',
      explanation:
        'MA20 là giá trung bình trong 20 phiên gần nhất. Khi giá nằm trên MA20, thường cho thấy xu hướng tăng đang hình thành. Khi giá nằm dưới MA20, có thể là dấu hiệu xu hướng giảm.',
    },
    {
      term: 'ROC10',
      explanation:
        'ROC10 (Rate of Change) đo lường phần trăm thay đổi giá trong 10 phiên gần nhất. ROC10 dương cho thấy giá đang tăng, ROC10 âm cho thấy giá đang giảm. Giá trị càng lớn, xu hướng càng mạnh.',
    },
    {
      term: 'Độ biến động',
      explanation:
        'Độ biến động (volatility) đo lường mức độ dao động của giá. Biến động cao có nghĩa là giá thay đổi nhiều, rủi ro cao hơn. Biến động thấp có nghĩa là giá ổn định hơn, nhưng cũng có thể ít cơ hội tăng giá.',
    },
    {
      term: 'Khối lượng giao dịch',
      explanation:
        'Khối lượng giao dịch là số lượng cổ phiếu được mua/bán trong một phiên. Khối lượng cao thường đi kèm với xu hướng mạnh, trong khi khối lượng thấp có thể cho thấy thị trường đang chờ đợi.',
    },
  ]

  // Pick the most relevant concept based on current data
  if (Math.abs(trend.roc10) > 3) {
    return concepts[1].explanation // ROC10
  } else if (risk.volatility20 > 3) {
    return concepts[2].explanation // Volatility
  } else if (trend.ma20 > 0) {
    return concepts[0].explanation // MA20
  } else {
    return concepts[3].explanation // Volume
  }
}

