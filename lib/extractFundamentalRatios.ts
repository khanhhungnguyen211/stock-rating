// lib/extractFundamentalRatios.ts

/**
 * Extract các chỉ số tài chính từ vnstock fundamentals response
 */

import { VnstockFundamentalResponse } from './vnstockClient'

export interface ExtractedRatios {
  pb?: number // Price-to-Book
  roa?: number // Return on Assets
  currentRatio?: number // Tỷ số thanh khoản ngắn hạn
  quickRatio?: number // Tỷ số thanh khoản nhanh
  profitMargin?: number // Biên lợi nhuận (%)
  operatingMargin?: number // Biên lợi nhuận hoạt động (%)
  revenueGrowth?: number // Tăng trưởng doanh thu (YoY %)
  epsGrowth?: number // Tăng trưởng EPS (YoY %)
  debtToEquity?: number // Nợ/vốn chủ
  epsGrowth3Y?: number // Tăng trưởng EPS 3 năm (%)
  revenueGrowth3Y?: number // Tăng trưởng doanh thu 3 năm (%)
}

/**
 * Extract các chỉ số tài chính từ vnstock fundamentals
 */
export function extractFundamentalRatios(
  fundamentals: VnstockFundamentalResponse | null,
  currentPrice: number // in thousands of VND
): ExtractedRatios {
  const result: ExtractedRatios = {}

  if (!fundamentals || !fundamentals.ratios || fundamentals.ratios.length === 0) {
    return result
  }

  // Tìm năm gần nhất
  const years = fundamentals.ratios.map((r: any) => {
    const year = r['Meta_Năm'] || r['Năm'] || 0
    return typeof year === 'number' ? year : parseInt(String(year)) || 0
  })
  const latestYear = Math.max(...years)

  // Lấy ratio của năm gần nhất
  const latestRatio = fundamentals.ratios.find((r: any) => {
    const year = r['Meta_Năm'] || r['Năm'] || 0
    const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
    return yearNum === latestYear
  }) || fundamentals.ratios[0]

  // Extract P/B (Price-to-Book)
  const pbValue =
    latestRatio?.['Chỉ tiêu định giá_P/B'] ||
    latestRatio?.['Chỉ tiêu định giá_P_B'] ||
    latestRatio?.P_B ||
    latestRatio?.pb ||
    latestRatio?.PB ||
    null

  if (pbValue !== null && pbValue !== undefined) {
    const pbNum = typeof pbValue === 'number' ? pbValue : parseFloat(String(pbValue))
    if (!isNaN(pbNum) && pbNum > 0) {
      result.pb = pbNum
    }
  }

  // Extract ROA (Return on Assets)
  const roaValue =
    latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROA (%)'] ||
    latestRatio?.['Chỉ tiêu khả năng sinh lời_ROA (%)'] ||
    latestRatio?.['Chỉ tiêu khả năng sinh lợi_ROA'] ||
    latestRatio?.['Chỉ tiêu khả năng sinh lời_ROA'] ||
    latestRatio?.ROA ||
    latestRatio?.roa ||
    null

  if (roaValue !== null && roaValue !== undefined) {
    const roaNum = typeof roaValue === 'number' ? roaValue : parseFloat(String(roaValue))
    if (!isNaN(roaNum)) {
      // Nếu giá trị < 1, coi là số thập phân -> nhân 100
      result.roa = roaNum < 1 ? roaNum * 100 : roaNum
    }
  }

  // Extract Current Ratio
  const currentRatioValue =
    latestRatio?.['Chỉ tiêu thanh khoản_Tỷ số thanh khoản hiện thời'] ||
    latestRatio?.['Chỉ tiêu thanh khoản_Tỷ số thanh khoản hiện tại'] ||
    latestRatio?.['Chỉ tiêu thanh khoản_Current Ratio'] ||
    latestRatio?.Current_Ratio ||
    latestRatio?.current_ratio ||
    latestRatio?.currentRatio ||
    null

  if (currentRatioValue !== null && currentRatioValue !== undefined) {
    const ratioNum = typeof currentRatioValue === 'number' ? currentRatioValue : parseFloat(String(currentRatioValue))
    if (!isNaN(ratioNum) && ratioNum > 0) {
      result.currentRatio = ratioNum
    }
  }

  // Extract Quick Ratio
  const quickRatioValue =
    latestRatio?.['Chỉ tiêu thanh khoản_Tỷ số thanh toán nhanh'] ||
    latestRatio?.['Chỉ tiêu thanh khoản_Quick Ratio'] ||
    latestRatio?.Quick_Ratio ||
    latestRatio?.quick_ratio ||
    latestRatio?.quickRatio ||
    null

  if (quickRatioValue !== null && quickRatioValue !== undefined) {
    const ratioNum = typeof quickRatioValue === 'number' ? quickRatioValue : parseFloat(String(quickRatioValue))
    if (!isNaN(ratioNum) && ratioNum > 0) {
      result.quickRatio = ratioNum
    }
  }

  // Extract Profit Margin
  const profitMarginValue =
    latestRatio?.['Chỉ tiêu hiệu quả hoạt động_Biên lợi nhuận ròng (%)'] ||
    latestRatio?.['Chỉ tiêu hiệu quả hoạt động_Biên lợi nhuận (%)'] ||
    latestRatio?.['Chỉ tiêu hiệu quả hoạt động_Profit Margin (%)'] ||
    latestRatio?.Profit_Margin ||
    latestRatio?.profit_margin ||
    latestRatio?.profitMargin ||
    null

  if (profitMarginValue !== null && profitMarginValue !== undefined) {
    const marginNum = typeof profitMarginValue === 'number' ? profitMarginValue : parseFloat(String(profitMarginValue))
    if (!isNaN(marginNum)) {
      // Nếu giá trị < 1, coi là số thập phân -> nhân 100
      result.profitMargin = marginNum < 1 ? marginNum * 100 : marginNum
    }
  }

  // Extract Operating Margin
  const operatingMarginValue =
    latestRatio?.['Chỉ tiêu hiệu quả hoạt động_Biên lợi nhuận hoạt động (%)'] ||
    latestRatio?.['Chỉ tiêu hiệu quả hoạt động_Operating Margin (%)'] ||
    latestRatio?.Operating_Margin ||
    latestRatio?.operating_margin ||
    latestRatio?.operatingMargin ||
    null

  if (operatingMarginValue !== null && operatingMarginValue !== undefined) {
    const marginNum = typeof operatingMarginValue === 'number' ? operatingMarginValue : parseFloat(String(operatingMarginValue))
    if (!isNaN(marginNum)) {
      // Nếu giá trị < 1, coi là số thập phân -> nhân 100
      result.operatingMargin = marginNum < 1 ? marginNum * 100 : marginNum
    }
  }

  // Extract Debt/Equity
  const debtToEquityValue =
    latestRatio?.['Chỉ tiêu cơ cấu tài chính_Nợ/Vốn chủ sở hữu'] ||
    latestRatio?.['Chỉ tiêu cơ cấu tài chính_Debt/Equity'] ||
    latestRatio?.Debt_Equity ||
    latestRatio?.debt_equity ||
    latestRatio?.debtToEquity ||
    null

  if (debtToEquityValue !== null && debtToEquityValue !== undefined) {
    const deNum = typeof debtToEquityValue === 'number' ? debtToEquityValue : parseFloat(String(debtToEquityValue))
    if (!isNaN(deNum) && deNum >= 0) {
      result.debtToEquity = deNum
    }
  }

  // Tính Revenue Growth và EPS Growth (YoY) - so sánh với năm trước
  const sortedYears = [...years].sort((a, b) => b - a)
  if (sortedYears.length >= 2) {
    const previousYear = sortedYears[1]
    const previousRatio = fundamentals.ratios.find((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
      return yearNum === previousYear
    })

    if (previousRatio) {
      // Revenue Growth
      const currentRevenue =
        latestRatio?.['Chỉ tiêu quy mô_Doanh thu thuần'] ||
        latestRatio?.['Chỉ tiêu quy mô_Doanh thu'] ||
        latestRatio?.Revenue ||
        latestRatio?.revenue ||
        null

      const previousRevenue =
        previousRatio?.['Chỉ tiêu quy mô_Doanh thu thuần'] ||
        previousRatio?.['Chỉ tiêu quy mô_Doanh thu'] ||
        previousRatio?.Revenue ||
        previousRatio?.revenue ||
        null

      if (currentRevenue && previousRevenue && previousRevenue > 0) {
        result.revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100
      }

      // EPS Growth
      const currentEps =
        latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
        latestRatio?.['Chỉ tiêu định giá_EPS'] ||
        latestRatio?.EPS ||
        latestRatio?.eps ||
        null

      const previousEps =
        previousRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
        previousRatio?.['Chỉ tiêu định giá_EPS'] ||
        previousRatio?.EPS ||
        previousRatio?.eps ||
        null

      if (currentEps && previousEps && previousEps > 0) {
        result.epsGrowth = ((currentEps - previousEps) / previousEps) * 100
      }
    }
  }

  // Tính EPS Growth 3Y và Revenue Growth 3Y nếu có đủ 3 năm
  if (sortedYears.length >= 3) {
    const year3Ago = sortedYears[2]
    const ratio3Ago = fundamentals.ratios.find((r: any) => {
      const year = r['Meta_Năm'] || r['Năm'] || 0
      const yearNum = typeof year === 'number' ? year : parseInt(String(year)) || 0
      return yearNum === year3Ago
    })

    if (ratio3Ago) {
      // EPS Growth 3Y
      const currentEps =
        latestRatio?.['Chỉ tiêu định giá_EPS (VND)'] ||
        latestRatio?.['Chỉ tiêu định giá_EPS'] ||
        latestRatio?.EPS ||
        latestRatio?.eps ||
        null

      const eps3Ago =
        ratio3Ago?.['Chỉ tiêu định giá_EPS (VND)'] ||
        ratio3Ago?.['Chỉ tiêu định giá_EPS'] ||
        ratio3Ago?.EPS ||
        ratio3Ago?.eps ||
        null

      if (currentEps && eps3Ago && eps3Ago > 0) {
        // CAGR = ((Current / Past)^(1/3) - 1) * 100
        const cagr = (Math.pow(currentEps / eps3Ago, 1 / 3) - 1) * 100
        result.epsGrowth3Y = cagr
      }

      // Revenue Growth 3Y
      const currentRevenue =
        latestRatio?.['Chỉ tiêu quy mô_Doanh thu thuần'] ||
        latestRatio?.['Chỉ tiêu quy mô_Doanh thu'] ||
        latestRatio?.Revenue ||
        latestRatio?.revenue ||
        null

      const revenue3Ago =
        ratio3Ago?.['Chỉ tiêu quy mô_Doanh thu thuần'] ||
        ratio3Ago?.['Chỉ tiêu quy mô_Doanh thu'] ||
        ratio3Ago?.Revenue ||
        ratio3Ago?.revenue ||
        null

      if (currentRevenue && revenue3Ago && revenue3Ago > 0) {
        // CAGR = ((Current / Past)^(1/3) - 1) * 100
        const cagr = (Math.pow(currentRevenue / revenue3Ago, 1 / 3) - 1) * 100
        result.revenueGrowth3Y = cagr
      }
    }
  }

  return result
}

