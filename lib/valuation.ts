import { Stock } from '@prisma/client'

export interface StockValuation {
  pe_fair: number
  fair_value: number
  discount: number
  score: number
  status_tag: 'Rẻ' | 'Hợp lý' | 'Đắt'
}

export interface StockWithValuation extends Stock {
  valuation: StockValuation
}

/**
 * Tính PE hợp lý dựa trên growth rate
 * pe_fair = 8 + growth_rate
 * Đảm bảo P/E luôn dương (tối thiểu 5, tối đa 50)
 */
export function calculatePEFair(growthRate: number): number {
  const peFair = 8 + growthRate
  // P/E không thể âm, clamp trong khoảng [5, 50]
  return Math.max(5, Math.min(50, peFair))
}

/**
 * Tính giá trị hợp lý (fair value)
 * fair_value = eps * pe_fair
 */
export function calculateFairValue(eps: number, peFair: number): number {
  return eps * peFair
}

/**
 * Tính phần trăm chênh lệch (discount)
 * discount = (fair_value - price) / fair_value
 * 
 * Giới hạn discount trong khoảng hợp lý [-2, 2] (tức -200% đến +200%)
 * để tránh giá trị quá lớn do dữ liệu sai hoặc tính toán bất thường
 */
export function calculateDiscount(fairValue: number, price: number): number {
  if (fairValue === 0) return 0
  const discount = (fairValue - price) / fairValue
  // Giới hạn discount trong khoảng hợp lý [-2, 2] (tức -200% đến +200%)
  return Math.max(-2, Math.min(2, discount))
}

/**
 * Tính điểm score (0-100)
 * - Nếu discount > 0: score = min(100, 50 + discount * 100)
 * - Nếu discount <= 0: score = max(1, 50 + discount * 50)
 * 
 * Cải thiện: 
 * - Giảm hệ số từ 100 xuống 50 khi discount < 0 để score phân bố tốt hơn
 * - Giới hạn discount tối thiểu ở -1.0 (giá đắt hơn fair value tối đa 100%)
 * - Đảm bảo score tối thiểu là 1 (trừ khi discount cực đoan < -1.0)
 */
export function calculateScore(discount: number): number {
  if (discount > 0) {
    return Math.min(100, 50 + discount * 100)
  } else {
    // Giới hạn discount ở -1.0 và giảm hệ số xuống 50
    const clampedDiscount = Math.max(-1.0, discount)
    const rawScore = 50 + clampedDiscount * 50
    // Đảm bảo score tối thiểu là 1 (trừ khi discount cực đoan)
    return Math.max(1, Math.min(100, rawScore))
  }
}

/**
 * Xác định status tag dựa trên discount
 * - discount > 0.2 → "Rẻ"
 * - 0 < discount <= 0.2 → "Hợp lý"
 * - discount <= 0 → "Đắt"
 */
export function getStatusTag(discount: number): 'Rẻ' | 'Hợp lý' | 'Đắt' {
  if (discount > 0.2) {
    return 'Rẻ'
  } else if (discount > 0) {
    return 'Hợp lý'
  } else {
    return 'Đắt'
  }
}

/**
 * Tính toán toàn bộ định giá cho một cổ phiếu
 * 
 * Lưu ý: Price trong DB đang lưu theo đơn vị nghìn VND (ví dụ: 58.3 = 58,300 VND)
 * EPS đang lưu theo đơn vị VND (ví dụ: 1880.56 VND)
 * 
 * Validation:
 * - EPS phải > 0, nếu không thì fair_value = 0 và discount = 0
 * - Price phải > 0, nếu không thì discount = 0
 */
export function calculateValuation(stock: Stock): StockValuation {
  // Validate dữ liệu đầu vào
  const eps = stock.eps && stock.eps > 0 ? stock.eps : 0
  const price = stock.price && stock.price > 0 ? stock.price : 0
  
  // Nếu thiếu dữ liệu cơ bản, trả về giá trị mặc định
  if (eps === 0 || price === 0) {
    return {
      pe_fair: calculatePEFair(stock.growth_rate || 0),
      fair_value: 0,
      discount: 0,
      score: 50, // Điểm trung bình khi không có dữ liệu
      status_tag: 'Hợp lý',
    }
  }

  const peFair = calculatePEFair(stock.growth_rate || 0)
  const fairValue = calculateFairValue(eps, peFair)
  
  // Convert price từ nghìn VND sang VND để tính discount
  const priceInVND = price * 1000
  const discount = calculateDiscount(fairValue, priceInVND)
  const score = calculateScore(discount)
  const statusTag = getStatusTag(discount)

  return {
    pe_fair: peFair,
    fair_value: fairValue,
    discount,
    score,
    status_tag: statusTag,
  }
}

/**
 * Tạo nhận xét tự động dựa trên discount
 */
export function generateComment(stockWithValuation: StockWithValuation): string {
  const { discount } = stockWithValuation.valuation

  if (discount > 0.2) {
    return 'Định giá hấp dẫn cho nhà đầu tư dài hạn, có thể cân nhắc giải ngân dần.'
  } else if (discount > 0) {
    return 'Giá đang ở vùng hợp lý, phù hợp để tích lũy từ từ nếu tin vào tăng trưởng doanh nghiệp.'
  } else {
    return 'Cổ phiếu đang được định giá cao so với ước tính, nên thận trọng trước khi mua mới.'
  }
}


