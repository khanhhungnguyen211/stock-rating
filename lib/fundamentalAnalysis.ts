// lib/fundamentalAnalysis.ts

/**
 * Phân tích và đánh giá các chỉ số tài chính với logic dễ hiểu cho người mới
 */

export interface RatioAnalysis {
  value: number
  label: string // "Tốt", "Trung bình", "Cần cải thiện"
  color: 'emerald' | 'blue' | 'amber' | 'rose'
  benchmark: string // "Tốt (≥10%)", "Trung bình (5-10%)"
  explanation: string // Giải thích ngắn gọn
}

/**
 * Phân tích P/B (Price-to-Book)
 * P/B < 1: Rẻ so với giá trị sổ sách
 * P/B 1-2: Hợp lý
 * P/B > 2: Đắt
 */
export function analyzePB(pb: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (pb < 1) {
    label = 'Rẻ'
    color = 'emerald'
    benchmark = 'Rẻ (<1.0)'
    explanation = 'Giá thị trường thấp hơn giá trị sổ sách, có thể là cơ hội đầu tư.'
  } else if (pb <= 2) {
    label = 'Hợp lý'
    color = 'blue'
    benchmark = 'Hợp lý (1.0-2.0)'
    explanation = 'Giá thị trường tương đương với giá trị sổ sách, mức hợp lý.'
  } else if (pb <= 3) {
    label = 'Hơi cao'
    color = 'amber'
    benchmark = 'Hơi cao (2.0-3.0)'
    explanation = 'Giá thị trường cao hơn giá trị sổ sách, cần xem xét kỹ.'
  } else {
    label = 'Rất cao'
    color = 'rose'
    benchmark = 'Rất cao (>3.0)'
    explanation = 'Giá thị trường cao hơn nhiều so với giá trị sổ sách, rủi ro cao.'
  }

  return {
    value: pb,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích ROA (Return on Assets)
 * ROA > 10%: Tốt
 * ROA 5-10%: Trung bình
 * ROA < 5%: Yếu
 */
export function analyzeROA(roa: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (roa >= 10) {
    label = 'Tốt'
    color = 'emerald'
    benchmark = 'Tốt (≥10%)'
    explanation = 'Doanh nghiệp sử dụng tài sản hiệu quả, tạo lợi nhuận tốt.'
  } else if (roa >= 5) {
    label = 'Trung bình'
    color = 'blue'
    benchmark = 'Trung bình (5-10%)'
    explanation = 'Hiệu quả sử dụng tài sản ở mức trung bình, cần cải thiện.'
  } else if (roa > 0) {
    label = 'Yếu'
    color = 'amber'
    benchmark = 'Yếu (0-5%)'
    explanation = 'Hiệu quả sử dụng tài sản thấp, cần xem xét lại chiến lược.'
  } else {
    label = 'Lỗ'
    color = 'rose'
    benchmark = 'Lỗ (<0%)'
    explanation = 'Doanh nghiệp đang lỗ, không tạo lợi nhuận từ tài sản.'
  }

  return {
    value: roa,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích Current Ratio (Tỷ số thanh khoản ngắn hạn)
 * Current Ratio > 2: An toàn
 * Current Ratio 1-2: Ổn định
 * Current Ratio < 1: Rủi ro
 */
export function analyzeCurrentRatio(ratio: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (ratio >= 2) {
    label = 'An toàn'
    color = 'emerald'
    benchmark = 'An toàn (≥2.0)'
    explanation = 'Doanh nghiệp có đủ tài sản ngắn hạn để trả nợ, thanh khoản tốt.'
  } else if (ratio >= 1) {
    label = 'Ổn định'
    color = 'blue'
    benchmark = 'Ổn định (1.0-2.0)'
    explanation = 'Tài sản ngắn hạn đủ để trả nợ, nhưng không dư thừa nhiều.'
  } else {
    label = 'Rủi ro'
    color = 'rose'
    benchmark = 'Rủi ro (<1.0)'
    explanation = 'Tài sản ngắn hạn không đủ trả nợ, có thể gặp khó khăn thanh khoản.'
  }

  return {
    value: ratio,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích Quick Ratio (Tỷ số thanh khoản nhanh)
 * Quick Ratio > 1: An toàn
 * Quick Ratio 0.5-1: Ổn định
 * Quick Ratio < 0.5: Rủi ro
 */
export function analyzeQuickRatio(ratio: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (ratio >= 1) {
    label = 'An toàn'
    color = 'emerald'
    benchmark = 'An toàn (≥1.0)'
    explanation = 'Có đủ tài sản thanh khoản nhanh (tiền, chứng khoán) để trả nợ ngắn hạn.'
  } else if (ratio >= 0.5) {
    label = 'Ổn định'
    color = 'blue'
    benchmark = 'Ổn định (0.5-1.0)'
    explanation = 'Tài sản thanh khoản nhanh ở mức vừa phải, cần theo dõi.'
  } else {
    label = 'Rủi ro'
    color = 'rose'
    benchmark = 'Rủi ro (<0.5)'
    explanation = 'Thiếu tài sản thanh khoản nhanh, có thể gặp khó khăn khi cần trả nợ gấp.'
  }

  return {
    value: ratio,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích Profit Margin (Biên lợi nhuận)
 * Profit Margin > 15%: Tốt
 * Profit Margin 5-15%: Trung bình
 * Profit Margin < 5%: Yếu
 */
export function analyzeProfitMargin(margin: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (margin >= 15) {
    label = 'Tốt'
    color = 'emerald'
    benchmark = 'Tốt (≥15%)'
    explanation = 'Doanh nghiệp có biên lợi nhuận cao, hiệu quả kinh doanh tốt.'
  } else if (margin >= 5) {
    label = 'Trung bình'
    color = 'blue'
    benchmark = 'Trung bình (5-15%)'
    explanation = 'Biên lợi nhuận ở mức trung bình, cần cải thiện hiệu quả.'
  } else if (margin > 0) {
    label = 'Yếu'
    color = 'amber'
    benchmark = 'Yếu (0-5%)'
    explanation = 'Biên lợi nhuận thấp, doanh nghiệp cần tối ưu chi phí hoặc tăng giá.'
  } else {
    label = 'Lỗ'
    color = 'rose'
    benchmark = 'Lỗ (<0%)'
    explanation = 'Doanh nghiệp đang lỗ, chi phí cao hơn doanh thu.'
  }

  return {
    value: margin,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích Operating Margin (Biên lợi nhuận hoạt động)
 * Operating Margin > 20%: Tốt
 * Operating Margin 10-20%: Trung bình
 * Operating Margin < 10%: Yếu
 */
export function analyzeOperatingMargin(margin: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (margin >= 20) {
    label = 'Tốt'
    color = 'emerald'
    benchmark = 'Tốt (≥20%)'
    explanation = 'Hoạt động kinh doanh chính tạo lợi nhuận tốt, hiệu quả cao.'
  } else if (margin >= 10) {
    label = 'Trung bình'
    color = 'blue'
    benchmark = 'Trung bình (10-20%)'
    explanation = 'Biên lợi nhuận hoạt động ở mức trung bình, cần cải thiện.'
  } else if (margin > 0) {
    label = 'Yếu'
    color = 'amber'
    benchmark = 'Yếu (0-10%)'
    explanation = 'Biên lợi nhuận hoạt động thấp, cần tối ưu chi phí hoạt động.'
  } else {
    label = 'Lỗ'
    color = 'rose'
    benchmark = 'Lỗ (<0%)'
    explanation = 'Hoạt động kinh doanh chính đang lỗ, cần xem xét lại mô hình kinh doanh.'
  }

  return {
    value: margin,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích Revenue Growth (Tăng trưởng doanh thu)
 * Growth > 20%: Tăng trưởng mạnh
 * Growth 5-20%: Tăng trưởng ổn định
 * Growth < 5%: Tăng trưởng chậm
 */
export function analyzeRevenueGrowth(growth: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (growth >= 20) {
    label = 'Tăng trưởng mạnh'
    color = 'emerald'
    benchmark = 'Mạnh (≥20%)'
    explanation = 'Doanh thu tăng trưởng mạnh, doanh nghiệp đang mở rộng tốt.'
  } else if (growth >= 5) {
    label = 'Tăng trưởng ổn định'
    color = 'blue'
    benchmark = 'Ổn định (5-20%)'
    explanation = 'Doanh thu tăng trưởng ổn định, phù hợp với thị trường.'
  } else if (growth > 0) {
    label = 'Tăng trưởng chậm'
    color = 'amber'
    benchmark = 'Chậm (0-5%)'
    explanation = 'Doanh thu tăng trưởng chậm, cần tìm cách mở rộng thị trường.'
  } else {
    label = 'Suy giảm'
    color = 'rose'
    benchmark = 'Suy giảm (<0%)'
    explanation = 'Doanh thu đang giảm, doanh nghiệp gặp khó khăn trong kinh doanh.'
  }

  return {
    value: growth,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích EPS Growth (Tăng trưởng EPS)
 * Growth > 15%: Tăng trưởng mạnh
 * Growth 5-15%: Tăng trưởng ổn định
 * Growth < 5%: Tăng trưởng chậm
 */
export function analyzeEPSGrowth(growth: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (growth >= 15) {
    label = 'Tăng trưởng mạnh'
    color = 'emerald'
    benchmark = 'Mạnh (≥15%)'
    explanation = 'Lợi nhuận trên mỗi cổ phiếu tăng trưởng mạnh, cổ đông được hưởng lợi.'
  } else if (growth >= 5) {
    label = 'Tăng trưởng ổn định'
    color = 'blue'
    benchmark = 'Ổn định (5-15%)'
    explanation = 'Lợi nhuận trên mỗi cổ phiếu tăng trưởng ổn định, bền vững.'
  } else if (growth > 0) {
    label = 'Tăng trưởng chậm'
    color = 'amber'
    benchmark = 'Chậm (0-5%)'
    explanation = 'Lợi nhuận trên mỗi cổ phiếu tăng trưởng chậm, cần cải thiện.'
  } else {
    label = 'Suy giảm'
    color = 'rose'
    benchmark = 'Suy giảm (<0%)'
    explanation = 'Lợi nhuận trên mỗi cổ phiếu đang giảm, cổ đông bị ảnh hưởng.'
  }

  return {
    value: growth,
    label,
    color,
    benchmark,
    explanation,
  }
}

/**
 * Phân tích PEG Ratio (P/E Growth Ratio)
 * PEG < 1: Rẻ so với tăng trưởng
 * PEG 1-2: Hợp lý
 * PEG > 2: Đắt
 */
export function analyzePEG(peg: number, pe: number, growth: number): RatioAnalysis {
  let label: string
  let color: 'emerald' | 'blue' | 'amber' | 'rose'
  let benchmark: string
  let explanation: string

  if (peg < 1) {
    label = 'Rẻ'
    color = 'emerald'
    benchmark = 'Rẻ (<1.0)'
    explanation = `P/E (${pe.toFixed(1)}) thấp so với tăng trưởng (${growth.toFixed(1)}%), có thể là cơ hội.`
  } else if (peg <= 2) {
    label = 'Hợp lý'
    color = 'blue'
    benchmark = 'Hợp lý (1.0-2.0)'
    explanation = `P/E (${pe.toFixed(1)}) tương đương với tăng trưởng (${growth.toFixed(1)}%), mức hợp lý.`
  } else {
    label = 'Đắt'
    color = 'rose'
    benchmark = 'Đắt (>2.0)'
    explanation = `P/E (${pe.toFixed(1)}) cao hơn nhiều so với tăng trưởng (${growth.toFixed(1)}%), có thể đắt.`
  }

  return {
    value: peg,
    label,
    color,
    benchmark,
    explanation,
  }
}

