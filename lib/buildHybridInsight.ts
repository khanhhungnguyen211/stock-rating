// lib/buildHybridInsight.ts

import { ShortTermAnalysis } from './analysis/shortTermEngine'
import { StockInsights } from './stockInsights'
import { CombinedSignal, HybridInsightData, FundamentalSnapshot } from '@/app/components/HybridInsightCard'
import {
  analyzePB,
  analyzeROA,
  analyzeCurrentRatio,
  analyzeQuickRatio,
  analyzeProfitMargin,
  analyzeOperatingMargin,
  analyzeRevenueGrowth,
  analyzeEPSGrowth,
  analyzePEG,
  type RatioAnalysis,
} from './fundamentalAnalysis'
import { buildFinancialMetrics } from './buildFinancialMetrics'

/**
 * Build hybrid insight data from short-term analysis and fundamental insights
 */
export function buildHybridInsight(
  shortTermAnalysis: ShortTermAnalysis | null,
  insights: StockInsights,
  aiSummary: string,
  aiSuggestions: string[],
  aiKnowledge: string
): HybridInsightData {
  // Determine combined signal
  const combinedSignal = determineCombinedSignal(shortTermAnalysis, insights)

  // Extract short-term data
  const shortTerm = shortTermAnalysis
    ? {
        trendMode: shortTermAnalysis.trendMode,
        volumeMode: shortTermAnalysis.volumeMode,
        volatility: shortTermAnalysis.volatility,
        entryZone: shortTermAnalysis.pullbackZone || shortTermAnalysis.breakoutZone,
        tpZone: shortTermAnalysis.tpZoneShort,
        slZone: shortTermAnalysis.slZone,
      }
    : {
        trendMode: mapTrendToShortTerm(insights.trend.trend) as 'UP' | 'DOWN' | 'SIDEWAY',
        volumeMode: 'NORMAL' as const,
        volatility: mapVolatilityToShortTerm(insights.risk.volatility20) as 'LOW' | 'MEDIUM' | 'HIGH',
        entryZone: null,
        tpZone: null,
        slZone: null,
      }

  // Analyze additional ratios with explanations
  const additionalRatios: Record<string, RatioAnalysis> = {}

  if (insights.fundamental.pb !== undefined) {
    additionalRatios.pb = analyzePB(insights.fundamental.pb)
  }
  if (insights.fundamental.roa !== undefined) {
    additionalRatios.roa = analyzeROA(insights.fundamental.roa)
  }
  if (insights.fundamental.currentRatio !== undefined) {
    additionalRatios.currentRatio = analyzeCurrentRatio(insights.fundamental.currentRatio)
  }
  if (insights.fundamental.quickRatio !== undefined) {
    additionalRatios.quickRatio = analyzeQuickRatio(insights.fundamental.quickRatio)
  }
  if (insights.fundamental.profitMargin !== undefined) {
    additionalRatios.profitMargin = analyzeProfitMargin(insights.fundamental.profitMargin)
  }
  if (insights.fundamental.operatingMargin !== undefined) {
    additionalRatios.operatingMargin = analyzeOperatingMargin(insights.fundamental.operatingMargin)
  }
  if (insights.fundamental.revenueGrowth !== undefined) {
    additionalRatios.revenueGrowth = analyzeRevenueGrowth(insights.fundamental.revenueGrowth)
  }
  if (insights.fundamental.epsGrowth !== undefined) {
    additionalRatios.epsGrowth = analyzeEPSGrowth(insights.fundamental.epsGrowth)
  }
  if (insights.fundamental.peg !== undefined && insights.valuation.peCurrent > 0 && insights.fundamental.epsGrowth !== undefined) {
    additionalRatios.peg = analyzePEG(insights.fundamental.peg, insights.valuation.peCurrent, insights.fundamental.epsGrowth)
  }

  // Build financial metrics (for new FinancialSection component)
  const financialMetrics = buildFinancialMetrics(insights, additionalRatios)

  // Build fundamental snapshot
  const fundamentals: FundamentalSnapshot = {
    financialHealthLabel: getFinancialHealthLabel(insights.fundamental.health),
    financialHealthData: {
      roe: insights.fundamental.roe,
      debtToEquity: insights.fundamental.debtToEquity,
      growthRate: insights.fundamental.epsGrowth3Y,
    },
    valuationLabel: insights.valuation.zoneLabel,
    valuationData: {
      peCurrent: insights.valuation.peCurrent,
      peFair: insights.valuation.fairPE,
      discount: insights.valuation.discount,
    },
    businessQuality: getBusinessQualityLabel(insights.fundamental),
    businessQualityData: {
      roe: insights.fundamental.roe,
      health: insights.fundamental.health,
    },
    additionalRatios: Object.keys(additionalRatios).length > 0 ? additionalRatios : undefined,
    financialMetrics, // Add financial metrics for new UI
  }

  return {
    combinedSignal,
    shortTerm,
    fundamentals,
    summary: aiSummary,
    suggestions: aiSuggestions,
    knowledge: aiKnowledge,
  }
}

/**
 * Determine combined signal from short-term and fundamental analysis
 */
function determineCombinedSignal(
  shortTerm: ShortTermAnalysis | null,
  insights: StockInsights
): CombinedSignal {
  // If we have short-term analysis, use it
  if (shortTerm) {
    if (shortTerm.trendMode === 'UP' && shortTerm.riskLevel === 'LOW') {
      return 'Bullish'
    } else if (shortTerm.riskLevel === 'HIGH') {
      return 'Risky'
    } else {
      return 'Neutral'
    }
  }

  // Fallback to fundamental + trend analysis
  const isUptrend = insights.trend.trend === 'uptrend'
  const isGoodValuation = insights.valuation.zone === 'value' || insights.valuation.zone === 'deep_value'
  const isLowRisk = insights.risk.level === 'low'
  const isStrongFundamental = insights.fundamental.health === 'strong_growth' || insights.fundamental.health === 'stable'

  if (isUptrend && isGoodValuation && isLowRisk && isStrongFundamental) {
    return 'Bullish'
  } else if (insights.risk.level === 'high' || insights.valuation.zone === 'bubble') {
    return 'Risky'
  } else {
    return 'Neutral'
  }
}

/**
 * Map trend from stockInsights to short-term trend mode
 */
function mapTrendToShortTerm(trend: 'uptrend' | 'downtrend' | 'sideways' | 'volatile'): 'UP' | 'DOWN' | 'SIDEWAY' {
  switch (trend) {
    case 'uptrend':
      return 'UP'
    case 'downtrend':
      return 'DOWN'
    default:
      return 'SIDEWAY'
  }
}

/**
 * Map volatility to short-term volatility level
 */
function mapVolatilityToShortTerm(volatility: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (volatility < 2) {
    return 'LOW'
  } else if (volatility <= 5) {
    return 'MEDIUM'
  } else {
    return 'HIGH'
  }
}

/**
 * Get financial health label from fundamental health
 */
function getFinancialHealthLabel(health: 'strong_growth' | 'stable' | 'weakening' | 'high_debt'): string {
  switch (health) {
    case 'strong_growth':
      return 'Tăng trưởng mạnh'
    case 'stable':
      return 'Ổn định'
    case 'weakening':
      return 'Suy yếu'
    case 'high_debt':
      return 'Nợ cao'
    default:
      return 'Chưa đánh giá'
  }
}

/**
 * Get business quality label from fundamental insight
 */
function getBusinessQualityLabel(fundamental: {
  health: 'strong_growth' | 'stable' | 'weakening' | 'high_debt'
  roe: number
}): string {
  const { health, roe } = fundamental

  if (health === 'strong_growth' && roe > 20) {
    return 'Xuất sắc'
  } else if (health === 'stable' && roe > 15) {
    return 'Tốt'
  } else if (health === 'weakening' || roe < 10) {
    return 'Cần cải thiện'
  } else {
    return 'Trung bình'
  }
}

