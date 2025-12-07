// lib/buildFinancialMetrics.ts

import { StockInsights } from './stockInsights'
import { RatioAnalysis } from './fundamentalAnalysis'

export interface FundamentalLite {
  healthLabel: 'Mạnh' | 'Ổn định' | 'Yếu'
  valuationLabel: 'Rẻ' | 'Hợp lý' | 'Đắt'
  riskLabel: 'Thấp' | 'Trung bình' | 'Cao'
  growthLabel: 'Mạnh' | 'Ổn định' | 'Chậm'
}

export interface FundamentalPro {
  profitability: {
    score: number // 0-10
    metrics: Array<{ label: string; value: string }>
  }
  growth: {
    score: number // 0-10
    metrics: Array<{ label: string; value: string }>
  }
  valuation: {
    score: number // 0-10
    metrics: Array<{ label: string; value: string }>
  }
  financialRisk: {
    score: number // 0-10
    metrics: Array<{ label: string; value: string }>
  }
}

export interface FundamentalAISummary {
  oneLiner: string
  bullets: string[]
}

/**
 * Build fundamental metrics from insights
 */
export function buildFinancialMetrics(
  insights: StockInsights,
  additionalRatios: Record<string, RatioAnalysis>
): {
  lite: FundamentalLite
  pro: FundamentalPro
  summary: FundamentalAISummary
} {
  const { fundamental, valuation, risk } = insights

  // Build Lite labels
  const lite: FundamentalLite = {
    healthLabel: getHealthLabel(fundamental.health),
    valuationLabel: getValuationLabel(valuation.zoneLabel),
    riskLabel: getRiskLabel(risk.level),
    growthLabel: getGrowthLabel(fundamental.epsGrowth3Y, fundamental.revenueGrowth3Y, additionalRatios),
  }

  // Build Profitability metrics
  const profitabilityMetrics: Array<{ label: string; value: string }> = []
  let profitabilityScore = 5

  if (fundamental.roe) {
    profitabilityMetrics.push({
      label: 'ROE',
      value: `${fundamental.roe.toFixed(1)}%`,
    })
    if (fundamental.roe >= 18) profitabilityScore = 8
    else if (fundamental.roe >= 12) profitabilityScore = 6
    else profitabilityScore = 4
  }

  if (additionalRatios.roa) {
    profitabilityMetrics.push({
      label: 'ROA',
      value: `${additionalRatios.roa.value.toFixed(1)}%`,
    })
    if (additionalRatios.roa.value >= 10) profitabilityScore = Math.max(profitabilityScore, 8)
    else if (additionalRatios.roa.value >= 5) profitabilityScore = Math.max(profitabilityScore, 6)
  }

  if (additionalRatios.profitMargin) {
    profitabilityMetrics.push({
      label: 'Biên LN ròng',
      value: `${additionalRatios.profitMargin.value.toFixed(1)}%`,
    })
    if (additionalRatios.profitMargin.value >= 15) profitabilityScore = Math.max(profitabilityScore, 8)
    else if (additionalRatios.profitMargin.value >= 5) profitabilityScore = Math.max(profitabilityScore, 6)
  }

  // Build Growth metrics
  const growthMetrics: Array<{ label: string; value: string }> = []
  let growthScore = 5

  if (additionalRatios.epsGrowth) {
    growthMetrics.push({
      label: 'Tăng trưởng EPS',
      value: `+${additionalRatios.epsGrowth.value.toFixed(1)}%`,
    })
    if (additionalRatios.epsGrowth.value >= 15) growthScore = 8
    else if (additionalRatios.epsGrowth.value >= 5) growthScore = 6
    else growthScore = 4
  } else if (fundamental.epsGrowth3Y) {
    growthMetrics.push({
      label: 'Tăng trưởng EPS (3Y)',
      value: `+${fundamental.epsGrowth3Y.toFixed(1)}%`,
    })
    if (fundamental.epsGrowth3Y >= 15) growthScore = 8
    else if (fundamental.epsGrowth3Y >= 5) growthScore = 6
    else growthScore = 4
  }

  if (additionalRatios.revenueGrowth) {
    growthMetrics.push({
      label: 'Doanh thu',
      value: `+${additionalRatios.revenueGrowth.value.toFixed(1)}%`,
    })
  } else if (fundamental.revenueGrowth3Y) {
    growthMetrics.push({
      label: 'Doanh thu (3Y)',
      value: `+${fundamental.revenueGrowth3Y.toFixed(1)}%`,
    })
  }

  // Build Valuation metrics
  const valuationMetrics: Array<{ label: string; value: string }> = []
  let valuationScore = 5

  if (valuation.peCurrent > 0) {
    const discountPercent = Math.abs(valuation.discount * 100)
    valuationMetrics.push({
      label: 'P/E hiện tại',
      value: `${valuation.peCurrent.toFixed(1)}x${valuation.discount > 0 ? ` • Rẻ hơn ${discountPercent.toFixed(0)}%` : ''}`,
    })
    if (valuation.discount > 0.2) valuationScore = 9
    else if (valuation.discount > 0) valuationScore = 7
    else if (valuation.discount > -0.1) valuationScore = 5
    else valuationScore = 3
  }

  if (additionalRatios.pb) {
    valuationMetrics.push({
      label: 'P/B',
      value: `${additionalRatios.pb.value.toFixed(2)} • ${additionalRatios.pb.label}`,
    })
  }

  if (additionalRatios.peg) {
    valuationMetrics.push({
      label: 'PEG',
      value: `${additionalRatios.peg.value.toFixed(2)} • ${additionalRatios.peg.label}`,
    })
  }

  // Build Financial Risk metrics
  const financialRiskMetrics: Array<{ label: string; value: string }> = []
  let financialRiskScore = 5

  if (fundamental.debtToEquity !== undefined) {
    financialRiskMetrics.push({
      label: 'Nợ/Vốn',
      value: `${fundamental.debtToEquity.toFixed(1)}`,
    })
    if (fundamental.debtToEquity <= 1) financialRiskScore = 8
    else if (fundamental.debtToEquity <= 2) financialRiskScore = 6
    else financialRiskScore = 3
  }

  if (additionalRatios.currentRatio) {
    financialRiskMetrics.push({
      label: 'Thanh khoản',
      value: `${additionalRatios.currentRatio.value.toFixed(2)}`,
    })
  }

  const pro: FundamentalPro = {
    profitability: {
      score: profitabilityScore,
      metrics: profitabilityMetrics,
    },
    growth: {
      score: growthScore,
      metrics: growthMetrics,
    },
    valuation: {
      score: valuationScore,
      metrics: valuationMetrics,
    },
    financialRisk: {
      score: financialRiskScore,
      metrics: financialRiskMetrics,
    },
  }

  // Build AI Summary
  const summary: FundamentalAISummary = {
    oneLiner: buildOneLiner(insights, lite),
    bullets: [],
  }

  return { lite, pro, summary }
}

// Helper functions
function getHealthLabel(health: 'strong_growth' | 'stable' | 'weakening' | 'high_debt'): 'Mạnh' | 'Ổn định' | 'Yếu' {
  if (health === 'strong_growth') return 'Mạnh'
  if (health === 'stable') return 'Ổn định'
  return 'Yếu'
}

function getValuationLabel(zoneLabel: string): 'Rẻ' | 'Hợp lý' | 'Đắt' {
  if (zoneLabel.includes('Rẻ') || zoneLabel.includes('rẻ')) return 'Rẻ'
  if (zoneLabel.includes('Đắt') || zoneLabel.includes('đắt')) return 'Đắt'
  return 'Hợp lý'
}

function getRiskLabel(level: 'low' | 'medium' | 'high'): 'Thấp' | 'Trung bình' | 'Cao' {
  if (level === 'low') return 'Thấp'
  if (level === 'high') return 'Cao'
  return 'Trung bình'
}

function getGrowthLabel(
  epsGrowth3Y?: number,
  revenueGrowth3Y?: number,
  additionalRatios?: Record<string, RatioAnalysis>
): 'Mạnh' | 'Ổn định' | 'Chậm' {
  const epsGrowth = additionalRatios?.epsGrowth?.value || epsGrowth3Y || 0
  const revenueGrowth = additionalRatios?.revenueGrowth?.value || revenueGrowth3Y || 0
  const growth = Math.max(epsGrowth, revenueGrowth)
  
  if (growth >= 15) return 'Mạnh'
  if (growth >= 5) return 'Ổn định'
  return 'Chậm'
}

function buildOneLiner(insights: StockInsights, lite: FundamentalLite): string {
  const parts: string[] = []

  if (lite.healthLabel === 'Mạnh') {
    parts.push('sinh lời tốt')
  } else if (lite.healthLabel === 'Ổn định') {
    parts.push('sinh lời ổn định')
  }

  const epsGrowth = insights.fundamental.epsGrowth3Y || insights.fundamental.epsGrowth || 0
  if (epsGrowth >= 15) {
    parts.push('tăng trưởng EPS mạnh')
  } else if (epsGrowth >= 5) {
    parts.push('tăng trưởng EPS ổn định')
  }

  if (lite.valuationLabel === 'Rẻ') {
    parts.push('đang được định giá rẻ hơn trung bình ngành')
  } else if (lite.valuationLabel === 'Hợp lý') {
    parts.push('định giá hợp lý')
  }

  if (parts.length === 0) {
    return 'Doanh nghiệp có tình hình tài chính ổn định.'
  }

  return `Nhìn chung doanh nghiệp ${parts.join(', ')}.`
}

