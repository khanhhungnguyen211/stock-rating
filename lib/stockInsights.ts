export type PriceTrend = 'uptrend' | 'downtrend' | 'sideways' | 'volatile'

export type ValuationZone =
  | 'deep_value' // rất rẻ
  | 'value' // hấp dẫn
  | 'fair' // hợp lý
  | 'expensive' // hơi cao
  | 'bubble' // rất cao

export type RiskLevel = 'low' | 'medium' | 'high'

export type FundamentalHealth =
  | 'strong_growth'
  | 'stable'
  | 'weakening'
  | 'high_debt'

export interface ValuationInsight {
  // Số liệu cơ bản
  price: number // Giá hiện tại
  eps: number // EPS
  peCurrent: number // P/E hiện tại = price / eps
  peSector?: number // P/E ngành (optional)
  fairPE: number // P/E hợp lý
  fairValue: number // Giá trị hợp lý
  discount: number // -0.2 = đắt hơn 20%, 0.2 = rẻ hơn 20%
  zone: ValuationZone
  zoneLabel: string // "Rất rẻ" | "Hấp dẫn" | ...
  score: number // 0–100, càng cao càng hấp dẫn về giá
  summary: string // 1–2 câu tiếng Việt ngắn để hiển thị
  explanation: string[] // 1–3 bullet ngắn giải thích cách tính
}

export interface TrendInsight {
  trend: PriceTrend
  roc10: number // Rate of Change 10 ngày (%)
  ma20: number // Moving Average 20 ngày
  ma50?: number // Moving Average 50 ngày (optional)
  volatilityShort: number // % biến động ngắn hạn
  summary: string
  explanation: string[] // 1–2 bullet giải thích
}

export interface RiskInsight {
  level: RiskLevel
  volatility20: number // σ log-return 20 phiên (%)
  volumeSignal?: string // Tín hiệu khối lượng (optional)
  summary: string
  explanation: string[] // 1–2 bullet giải thích
}

export interface FundamentalInsight {
  health: FundamentalHealth
  roe: number // ROE (%)
  epsGrowth3Y?: number // Tăng trưởng EPS 3 năm (%)
  revenueGrowth3Y?: number // Tăng trưởng doanh thu 3 năm (%)
  debtToEquity?: number // Nợ/vốn chủ
  
  // Thêm các chỉ số mới
  pb?: number // Price-to-Book
  roa?: number // Return on Assets
  currentRatio?: number // Tỷ số thanh khoản ngắn hạn
  quickRatio?: number // Tỷ số thanh khoản nhanh
  profitMargin?: number // Biên lợi nhuận (%)
  operatingMargin?: number // Biên lợi nhuận hoạt động (%)
  revenueGrowth?: number // Tăng trưởng doanh thu (YoY %)
  epsGrowth?: number // Tăng trưởng EPS (YoY %)
  peg?: number // PEG Ratio
  
  summary: string
  explanation: string[] // 1–3 bullet giải thích
}

export interface StockInsights {
  valuation: ValuationInsight
  trend: TrendInsight
  risk: RiskInsight
  fundamental: FundamentalInsight
}

/**
 * Đánh giá định giá cổ phiếu
 */
export function evaluateValuation(params: {
  price: number
  eps: number
  growthRate: number // %/năm, ví dụ 12
  roe: number // %, ví dụ 18
  peSector?: number // optional: P/E trung bình ngành
}): ValuationInsight {
  const { price, eps, growthRate, roe, peSector } = params

  // Tính fair PE - ĐỒNG BỘ VỚI lib/valuation.ts
  // Đơn giản hóa: pe_fair = 8 + growth_rate (giống calculatePEFair)
  // Đảm bảo P/E luôn dương (tối thiểu 5, tối đa 50)
  // Để đảm bảo đồng bộ với trang danh sách
  let fairPE = 8 + growthRate
  fairPE = Math.max(5, Math.min(50, fairPE)) // Clamp trong [5, 50]
  
  // Nếu có peSector, tính trung bình (tùy chọn, không bắt buộc)
  if (peSector !== undefined && peSector > 0) {
    fairPE = 0.5 * fairPE + 0.5 * peSector
  }

  // Tính P/E hiện tại
  // Price trong DB đang lưu theo đơn vị nghìn VND (ví dụ: 12.4 = 12,400 VND)
  // EPS đang lưu theo đơn vị VND (ví dụ: 746.48 VND)
  // P/E = Price (VND) / EPS (VND) = (Price * 1000) / EPS
  const priceInVND = price * 1000
  const peCurrent = eps !== 0 ? priceInVND / eps : 0 // Cho phép EPS âm (P/E sẽ âm)

  // Tính fair value (theo đơn vị VND)
  const fairValue = eps * fairPE

  // Tính discount - ĐỒNG BỘ VỚI lib/valuation.ts
  // Price đang ở đơn vị nghìn VND, cần chuyển sang VND để so sánh với fairValue (VND)
  // Logic giống calculateDiscount: discount = (fairValue - price) / fairValue
  // Nếu fairValue = 0 thì discount = 0
  const discount = fairValue === 0 ? 0 : (fairValue - priceInVND) / fairValue

  // Xác định zone - ĐỒNG BỘ VỚI lib/valuation.ts
  // - discount > 0.2 → "Rẻ"
  // - 0 < discount <= 0.2 → "Hợp lý"
  // - discount <= 0 → "Đắt"
  let zone: ValuationZone
  let zoneLabel: string

  if (discount > 0.2) {
    zone = 'deep_value'
    zoneLabel = 'Rẻ'
  } else if (discount > 0) {
    zone = 'fair'
    zoneLabel = 'Hợp lý'
  } else {
    zone = 'expensive'
    zoneLabel = 'Đắt'
  }

  // Tính score - ĐỒNG BỘ VỚI lib/valuation.ts
  // - Nếu discount > 0: score = min(100, 50 + discount * 100)
  // - Nếu discount <= 0: score = max(0, 50 + discount * 100)
  let score: number
  if (discount > 0) {
    score = Math.min(100, 50 + discount * 100)
  } else {
    score = Math.max(0, 50 + discount * 100)
  }

  // Tạo summary - ĐỒNG BỘ VỚI lib/valuation.ts
  let summary = ''
  const discountPercent = Math.abs(discount * 100).toFixed(1)

  if (discount > 0.2) {
    // deep_value
    summary = `Giá đang được giao dịch thấp hơn giá trị ước tính khoảng ${discountPercent}%. Phù hợp để theo dõi nếu bạn đầu tư dài hạn.`
  } else if (discount > 0.15) {
    // value
    summary = `Giá đang được giao dịch thấp hơn giá trị ước tính khoảng ${discountPercent}%. Phù hợp để theo dõi nếu bạn đầu tư dài hạn.`
  } else if (discount > 0) {
    // fair
    summary = 'Giá đang ở vùng hợp lý so với giá trị ước tính.'
  } else if (discount > -0.15) {
    // expensive
    summary = `Giá đang cao hơn giá trị ước tính khoảng ${discountPercent}%, rủi ro điều chỉnh tăng.`
  } else {
    // bubble
    summary = `Giá đang cao hơn giá trị ước tính đáng kể (${discountPercent}%), rủi ro điều chỉnh tăng.`
  }

  // Tạo explanation - ĐỒNG BỘ VỚI lib/valuation.ts
  const explanation: string[] = []
  explanation.push(`P/E hợp lý = 8 (cơ bản) + ${growthRate.toFixed(1)}% (tăng trưởng) = ${fairPE.toFixed(1)}`)
  if (peSector !== undefined && peSector > 0) {
    const baseFairPE = 8 + growthRate
    explanation.push(`P/E hợp lý = ${baseFairPE.toFixed(1)} (tính toán) × 50% + ${peSector.toFixed(1)} (ngành) × 50% = ${fairPE.toFixed(1)}`)
  }
  explanation.push(`Giá trị hợp lý = EPS ${eps.toLocaleString('vi-VN')} × P/E ${fairPE.toFixed(1)} = ${fairValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`)

  return {
    price,
    eps,
    peCurrent,
    peSector,
    fairPE,
    fairValue,
    discount,
    zone,
    zoneLabel,
    score: Math.max(0, Math.min(100, score)),
    summary,
    explanation,
  }
}

/**
 * Tính trung bình động (Moving Average)
 */
function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  }
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/**
 * Tính độ lệch chuẩn
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Đánh giá xu hướng giá
 */
export function evaluateTrend(params: {
  prices: number[] // lịch sử giá, index cuối là gần nhất, tối thiểu 30 điểm
}): TrendInsight {
  const { prices } = params

  if (prices.length < 10) {
    return {
      trend: 'sideways',
      roc10: 0,
      ma20: 0,
      volatilityShort: 0,
      summary: 'Dữ liệu giá chưa đủ để đánh giá xu hướng.',
      explanation: ['Dữ liệu giá chưa đủ để tính toán các chỉ số kỹ thuật.'],
    }
  }

  const lastPrice = prices[prices.length - 1]
  const price10DaysAgo = prices.length >= 10 ? prices[prices.length - 10] : prices[0]

  // Tính MA20
  const ma20 = calculateMA(prices, 20)

  // Tính MA50 nếu đủ dữ liệu
  const ma50 = prices.length >= 50 ? calculateMA(prices, 50) : ma20

  // Tính Rate of Change 10 ngày
  const roc10 =
    price10DaysAgo > 0 ? (lastPrice - price10DaysAgo) / price10DaysAgo : 0

  // Tính độ lệch chuẩn của 20 ngày gần nhất
  const recent20Prices = prices.slice(-20)
  const stdDev = calculateStdDev(recent20Prices)
  const meanPrice = recent20Prices.reduce((a, b) => a + b, 0) / recent20Prices.length
  const volatility = meanPrice > 0 ? (stdDev / meanPrice) * 100 : 0

  // Phân loại xu hướng
  let trend: PriceTrend
  let summary: string
  const explanation: string[] = []

  const roc10Percent = (roc10 * 100).toFixed(2)
  const ma50Value = prices.length >= 50 ? calculateMA(prices, 50) : undefined

  // Kiểm tra volatile trước (độ lệch chuẩn cao)
  if (volatility > 5) {
    trend = 'volatile'
    summary = 'Giá biến động mạnh, không phù hợp với nhà đầu tư ngại rủi ro.'
    explanation.push(`Độ biến động 20 ngày ≈ ${volatility.toFixed(1)}%, cao hơn mức trung bình.`)
    explanation.push(`ROC 10 ngày ≈ ${roc10Percent}%, nhưng biến động quá lớn nên khó dự đoán.`)
  } else if (roc10 > 0.05 && lastPrice > ma20) {
    trend = 'uptrend'
    summary = 'Giá đang trong xu hướng tăng, đó là tín hiệu tích cực nhưng vẫn có thể biến động theo thị trường.'
    explanation.push(`ROC 10 ngày ≈ +${roc10Percent}% → xu hướng tăng nhẹ.`)
    explanation.push(`Giá hiện tại (${lastPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) nằm trên MA20 (${ma20.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) → tín hiệu tích cực.`)
  } else if (roc10 < -0.05 && lastPrice < ma20) {
    trend = 'downtrend'
    summary = 'Giá đang có xu hướng giảm trong ngắn hạn, cần theo dõi thêm.'
    explanation.push(`ROC 10 ngày ≈ ${roc10Percent}% → xu hướng giảm.`)
    explanation.push(`Giá hiện tại (${lastPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) nằm dưới MA20 (${ma20.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) → cần theo dõi.`)
  } else if (Math.abs(roc10) <= 0.03) {
    trend = 'sideways'
    summary = 'Giá dao động trong biên độ hẹp, xu hướng chưa rõ ràng.'
    explanation.push(`ROC 10 ngày ≈ ${roc10Percent}% → gần như đi ngang.`)
    explanation.push(`Giá nằm sát MA20 (${ma20.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) → xu hướng chưa rõ ràng.`)
  } else {
    // Trường hợp còn lại: có biến động nhưng chưa rõ xu hướng
    trend = 'sideways'
    summary = 'Giá dao động trong biên độ hẹp, xu hướng chưa rõ ràng.'
    explanation.push(`ROC 10 ngày ≈ ${roc10Percent}% → biến động nhẹ.`)
    explanation.push(`Giá dao động quanh MA20 (${ma20.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}) → chưa hình thành xu hướng rõ.`)
  }

  if (ma50Value !== undefined) {
    explanation.push(`MA50 = ${ma50Value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND`)
  }

  return {
    trend,
    roc10: roc10 * 100, // Chuyển sang %
    ma20,
    ma50: ma50Value,
    volatilityShort: volatility,
    summary,
    explanation,
  }
}

/**
 * Đánh giá rủi ro
 */
export function evaluateRisk(params: {
  prices: number[] // lịch sử giá
  volumes?: number[] // optional
  volatilityWindow?: number // default 20
}): RiskInsight {
  const { prices, volumes, volatilityWindow = 20 } = params

  if (prices.length < 2) {
    return {
      level: 'medium',
      volatility20: 0,
      summary: 'Dữ liệu chưa đủ để đánh giá rủi ro.',
      explanation: ['Dữ liệu giá chưa đủ để tính toán độ biến động.'],
    }
  }

  // Tính log-returns
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      const logReturn = Math.log(prices[i] / prices[i - 1])
      returns.push(logReturn)
    }
  }

  // Lấy window gần nhất
  const recentReturns = returns.slice(-volatilityWindow)
  if (recentReturns.length === 0) {
    return {
      level: 'medium',
      volatility20: 0,
      summary: 'Không thể tính toán độ biến động.',
      explanation: ['Không thể tính toán độ biến động từ dữ liệu hiện có.'],
    }
  }

  // Tính độ lệch chuẩn của log-returns (volatility)
  const meanReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length
  const variance =
    recentReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
    recentReturns.length
  const volatility = Math.sqrt(variance) * 100 // Chuyển sang %

  // Phân tích volume signal nếu có
  let volumeSignal: string | undefined
  if (volumes && volumes.length >= 20) {
    const recentVolumes = volumes.slice(-20)
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
    const lastVolume = volumes[volumes.length - 1]
    
    if (lastVolume > avgVolume * 1.2) {
      volumeSignal = 'Khối lượng giao dịch tăng mạnh gần đây'
    } else if (lastVolume < avgVolume * 0.8) {
      volumeSignal = 'Khối lượng giao dịch giảm, thanh khoản thấp'
    } else {
      volumeSignal = 'Khối lượng giao dịch ổn định'
    }
  }

  // Phân loại rủi ro
  let level: RiskLevel
  let summary: string
  const explanation: string[] = []

  if (volatility < 1.5) {
    level = 'low'
    summary = 'Biến động giá thấp, rủi ro ngắn hạn ở mức vừa phải.'
    explanation.push(`Độ biến động 20 phiên ≈ ${volatility.toFixed(2)}%/ngày, thấp hơn trung bình thị trường.`)
  } else if (volatility <= 3) {
    level = 'medium'
    summary = 'Biến động giá trung bình, cần chấp nhận một phần rủi ro.'
    explanation.push(`Độ biến động 20 phiên ≈ ${volatility.toFixed(2)}%/ngày, ở mức trung bình.`)
  } else {
    level = 'high'
    summary = 'Giá thường xuyên biến động mạnh, cần cân nhắc kỹ trước khi ra quyết định.'
    explanation.push(`Độ biến động 20 phiên ≈ ${volatility.toFixed(2)}%/ngày, cao hơn trung bình thị trường.`)
  }

  if (volumeSignal) {
    explanation.push(volumeSignal)
  }

  return {
    level,
    volatility20: volatility,
    volumeSignal,
    summary,
    explanation,
  }
}

/**
 * Đánh giá cơ bản
 */
export function evaluateFundamental(params: {
  roe: number
  epsGrowth3Y?: number // tăng trưởng EPS 3 năm (%)
  revenueGrowth3Y?: number // tăng trưởng doanh thu 3 năm (%)
  debtToEquity?: number // nợ/vốn chủ
  pb?: number // Price-to-Book
  roa?: number // Return on Assets
  currentRatio?: number // Tỷ số thanh khoản ngắn hạn
  quickRatio?: number // Tỷ số thanh khoản nhanh
  profitMargin?: number // Biên lợi nhuận (%)
  operatingMargin?: number // Biên lợi nhuận hoạt động (%)
  revenueGrowth?: number // Tăng trưởng doanh thu (YoY %)
  epsGrowth?: number // Tăng trưởng EPS (YoY %)
  peg?: number // PEG Ratio
}): FundamentalInsight {
  const { 
    roe, 
    epsGrowth3Y, 
    revenueGrowth3Y, 
    debtToEquity,
    pb,
    roa,
    currentRatio,
    quickRatio,
    profitMargin,
    operatingMargin,
    revenueGrowth,
    epsGrowth,
    peg
  } = params

  let health: FundamentalHealth
  let summary: string

  const explanation: string[] = []

  // Kiểm tra high_debt trước
  if (debtToEquity !== undefined && debtToEquity > 2) {
    health = 'high_debt'
    summary = `Tỷ lệ nợ ở mức cao (${debtToEquity.toFixed(1)}), rủi ro tài chính cần được lưu ý.`
    explanation.push(`D/E ≈ ${debtToEquity.toFixed(1)}, cao hơn mức an toàn (thường < 1).`)
    if (roe > 0) {
      explanation.push(`ROE ≈ ${roe.toFixed(1)}%`)
    }
  }
  // Kiểm tra weakening
  else if (
    (epsGrowth3Y !== undefined && epsGrowth3Y < 0) ||
    (revenueGrowth3Y !== undefined && revenueGrowth3Y < 0)
  ) {
    health = 'weakening'
    summary = 'Lợi nhuận có dấu hiệu chững lại hoặc giảm so với trước, cần theo dõi thêm.'
    explanation.push(`ROE ≈ ${roe.toFixed(1)}%`)
    if (epsGrowth3Y !== undefined) {
      explanation.push(`EPS tăng trưởng ${epsGrowth3Y.toFixed(1)}%/năm trong 3 năm (âm → suy giảm)`)
    }
    if (revenueGrowth3Y !== undefined) {
      explanation.push(`Doanh thu tăng trưởng ${revenueGrowth3Y.toFixed(1)}%/năm trong 3 năm`)
    }
    if (debtToEquity !== undefined) {
      explanation.push(`D/E ≈ ${debtToEquity.toFixed(1)}, ${debtToEquity <= 1 ? 'mức an toàn' : 'cần lưu ý'}`)
    }
  }
  // Kiểm tra strong_growth
  else if (
    roe > 18 &&
    epsGrowth3Y !== undefined &&
    epsGrowth3Y > 15
  ) {
    health = 'strong_growth'
    summary = 'Doanh nghiệp đang tăng trưởng tốt, lợi nhuận và ROE duy trì ở mức cao.'
    explanation.push(`ROE ≈ ${roe.toFixed(1)}% (tốt, > 18%)`)
    explanation.push(`EPS tăng trưởng ${epsGrowth3Y.toFixed(1)}%/năm trong 3 năm (mạnh)`)
    if (revenueGrowth3Y !== undefined) {
      explanation.push(`Doanh thu tăng trưởng ${revenueGrowth3Y.toFixed(1)}%/năm trong 3 năm`)
    }
    if (debtToEquity !== undefined) {
      explanation.push(`D/E ≈ ${debtToEquity.toFixed(1)}, ${debtToEquity <= 1 ? 'mức an toàn' : 'cần lưu ý'}`)
    }
  }
  // Kiểm tra stable
  else if (
    roe >= 12 &&
    roe <= 18 &&
    epsGrowth3Y !== undefined &&
    epsGrowth3Y >= 5 &&
    epsGrowth3Y <= 15
  ) {
    health = 'stable'
    summary = 'Kết quả kinh doanh ổn định, không biến động quá mạnh qua các năm.'
    explanation.push(`ROE ≈ ${roe.toFixed(1)}% (ổn định, 12–18%)`)
    explanation.push(`EPS tăng trưởng ${epsGrowth3Y.toFixed(1)}%/năm trong 3 năm (vừa phải)`)
    if (revenueGrowth3Y !== undefined) {
      explanation.push(`Doanh thu tăng trưởng ${revenueGrowth3Y.toFixed(1)}%/năm trong 3 năm`)
    }
    if (debtToEquity !== undefined) {
      explanation.push(`D/E ≈ ${debtToEquity.toFixed(1)}, ${debtToEquity <= 1 ? 'mức an toàn' : 'cần lưu ý'}`)
    }
  }
  // Trường hợp còn lại: dựa vào ROE
  else {
    explanation.push(`ROE ≈ ${roe.toFixed(1)}%`)
    if (epsGrowth3Y !== undefined) {
      explanation.push(`EPS tăng trưởng ${epsGrowth3Y.toFixed(1)}%/năm trong 3 năm`)
    }
    if (revenueGrowth3Y !== undefined) {
      explanation.push(`Doanh thu tăng trưởng ${revenueGrowth3Y.toFixed(1)}%/năm trong 3 năm`)
    }
    if (debtToEquity !== undefined) {
      explanation.push(`D/E ≈ ${debtToEquity.toFixed(1)}, ${debtToEquity <= 1 ? 'mức an toàn' : 'cần lưu ý'}`)
    }
    
    if (roe >= 15) {
      health = 'stable'
      summary = 'Kết quả kinh doanh ổn định, không biến động quá mạnh qua các năm.'
    } else if (roe >= 10) {
      health = 'stable'
      summary = 'Kết quả kinh doanh ổn định, không biến động quá mạnh qua các năm.'
    } else {
      health = 'weakening'
      summary = 'Lợi nhuận có dấu hiệu chững lại hoặc giảm so với trước, cần theo dõi thêm.'
    }
  }

  return {
    health,
    roe,
    epsGrowth3Y,
    revenueGrowth3Y,
    debtToEquity,
    pb,
    roa,
    currentRatio,
    quickRatio,
    profitMargin,
    operatingMargin,
    revenueGrowth,
    epsGrowth,
    peg,
    summary,
    explanation,
  }
}

/**
 * Đánh giá tổng hợp insights cho cổ phiếu
 */
export function evaluateStockInsights(params: {
  price: number
  eps: number
  growthRate: number
  roe: number
  peSector?: number
  pricesHistory: number[]
  volumesHistory?: number[]
  epsGrowth3Y?: number
  revenueGrowth3Y?: number
  debtToEquity?: number
  pb?: number
  roa?: number
  currentRatio?: number
  quickRatio?: number
  profitMargin?: number
  operatingMargin?: number
  revenueGrowth?: number
  epsGrowth?: number
  peg?: number
}): StockInsights {
  const {
    price,
    eps,
    growthRate,
    roe,
    peSector,
    pricesHistory,
    volumesHistory,
    epsGrowth3Y,
    revenueGrowth3Y,
    debtToEquity,
    pb,
    roa,
    currentRatio,
    quickRatio,
    profitMargin,
    operatingMargin,
    revenueGrowth,
    epsGrowth,
    peg,
  } = params

  // Đánh giá định giá
  const valuation = evaluateValuation({
    price,
    eps,
    growthRate,
    roe,
    peSector,
  })

  // Đánh giá xu hướng
  const trend = evaluateTrend({
    prices: pricesHistory,
  })

  // Đánh giá rủi ro
  const risk = evaluateRisk({
    prices: pricesHistory,
    volumes: volumesHistory,
  })

  // Đánh giá cơ bản
  const fundamental = evaluateFundamental({
    roe,
    epsGrowth3Y,
    revenueGrowth3Y,
    debtToEquity,
    pb,
    roa,
    currentRatio,
    quickRatio,
    profitMargin,
    operatingMargin,
    revenueGrowth,
    epsGrowth,
    peg,
  })

  return {
    valuation,
    trend,
    risk,
    fundamental,
  }
}

/**
 * Tạo dữ liệu giá lịch sử giả lập từ giá hiện tại
 * TODO: Đây chỉ là dữ liệu giả lập để demo UI/logic. 
 * Khi có bảng lịch sử giá thực tế trong database, hãy thay thế bằng dữ liệu thật.
 * 
 * @param price - Giá hiện tại của cổ phiếu
 * @returns Mảng 60 giá giả lập (60 ngày), index cuối cùng là giá hiện tại
 */
export function mockPriceHistoryFromCurrentPrice(price: number): number[] {
  const days = 60
  const prices: number[] = []
  
  // Bắt đầu từ giá hiện tại (ngày cuối cùng)
  prices.push(price)
  
  // Đi lùi 59 ngày, mỗi ngày random dao động ±1–2% quanh ngày sau đó
  let previousPrice = price
  for (let i = 1; i < days; i++) {
    // Random dao động ±1–2%
    const volatility = 0.01 + Math.random() * 0.01 // 1% đến 2%
    const direction = Math.random() < 0.5 ? -1 : 1 // Random tăng hoặc giảm
    const change = previousPrice * volatility * direction
    
    // Tính giá ngày trước đó (lùi về quá khứ)
    let dayPrice = previousPrice - change
    
    // Đảm bảo giá không quá thấp (tối thiểu 70% giá hiện tại)
    dayPrice = Math.max(dayPrice, price * 0.7)
    
    // Thêm vào đầu mảng để có thứ tự từ cũ đến mới
    prices.unshift(dayPrice)
    previousPrice = dayPrice
  }
  
  // Đảm bảo giá cuối cùng luôn là giá hiện tại
  prices[prices.length - 1] = price
  
  return prices
}

