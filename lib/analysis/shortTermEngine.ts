// lib/analysis/shortTermEngine.ts

/**
 * Short-Term Trading Analysis Engine (1-20 days)
 * 
 * This engine uses MA, volume, support/resistance, breakout, pullback
 * instead of ROC-based logic for more realistic short-term trading analysis.
 */

export type DailyBar = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TrendMode = 'UP' | 'DOWN' | 'SIDEWAY'
export type VolatilityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type VolumeMode = 'LOW' | 'NORMAL' | 'HIGH'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type IndicatorsPoint = {
  date: string
  close: number
  high: number
  low: number
  MA5: number
  MA10: number
  MA20: number
  MA50: number
  MA200: number
  VolMA20: number
  ATR14: number
}

export type IndicatorsSeries = IndicatorsPoint[]

export type Zones = {
  supportZone: [number, number]
  resistZone: [number, number]
  pullbackZone: [number, number] | null
  breakoutZone: [number, number] | null
  tpZoneShort: [number, number] | null
  slZone: [number, number] | null
}

export type ShortTermSignals = {
  hasPullbackLongSetup: boolean
  hasBreakoutLongSetup: boolean
  isNearSupport: boolean
  isNearResistance: boolean
  isDangerZone: boolean
}

export type ShortTermAnalysis = {
  trendMode: TrendMode
  volatility: VolatilityLevel
  volumeMode: VolumeMode
  supportZone: [number, number]
  resistZone: [number, number]
  pullbackZone: [number, number] | null
  breakoutZone: [number, number] | null
  tpZoneShort: [number, number] | null
  slZone: [number, number] | null
  riskLevel: RiskLevel
  signals: ShortTermSignals
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate Simple Moving Average
 */
function calculateMA(values: number[], period: number): number {
  if (values.length < period) {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

/**
 * Calculate Average True Range (ATR) for 14 periods
 */
function calculateATR14(bars: DailyBar[]): number {
  if (bars.length < 15) {
    // Not enough data, return a default ATR based on recent volatility
    if (bars.length < 2) return 0
    const recent = bars.slice(-Math.min(14, bars.length))
    const trs: number[] = []
    for (let i = 1; i < recent.length; i++) {
      const tr = Math.max(
        recent[i].high - recent[i].low,
        Math.abs(recent[i].high - recent[i - 1].close),
        Math.abs(recent[i].low - recent[i - 1].close)
      )
      trs.push(tr)
    }
    return trs.length > 0 ? trs.reduce((a, b) => a + b, 0) / trs.length : 0
  }

  // Calculate True Range for each bar
  const trs: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close)
    )
    trs.push(tr)
  }

  // Take the last 14 TR values and average them
  const last14TRs = trs.slice(-14)
  return last14TRs.reduce((a, b) => a + b, 0) / last14TRs.length
}

// ============================================================================
// Core Engine Functions
// ============================================================================

/**
 * Compute technical indicators for each day
 * Requires at least 200 bars for MA200, but will work with less (using available data)
 */
export function computeIndicators(ohlcv: DailyBar[]): IndicatorsSeries {
  if (ohlcv.length === 0) {
    return []
  }

  const series: IndicatorsSeries = []

  // Need at least 1 bar to start
  for (let i = 0; i < ohlcv.length; i++) {
    const barsUpToNow = ohlcv.slice(0, i + 1)
    const closes = barsUpToNow.map((b) => b.close)
    const volumes = barsUpToNow.map((b) => b.volume)

    const point: IndicatorsPoint = {
      date: ohlcv[i].date,
      close: ohlcv[i].close,
      high: ohlcv[i].high,
      low: ohlcv[i].low,
      MA5: calculateMA(closes, 5),
      MA10: calculateMA(closes, 10),
      MA20: calculateMA(closes, 20),
      MA50: calculateMA(closes, 50),
      MA200: calculateMA(closes, 200),
      VolMA20: calculateMA(volumes, 20),
      ATR14: calculateATR14(barsUpToNow),
    }

    series.push(point)
  }

  return series
}

/**
 * Classify short-term trend based on MA relationships
 */
export function classifyTrend(latest: IndicatorsPoint, series: IndicatorsSeries): TrendMode {
  const currentIndex = series.length - 1
  if (currentIndex < 5 || !latest.MA20 || !latest.MA50 || latest.MA20 === 0 || latest.MA50 === 0) {
    return 'SIDEWAY' // Not enough data or invalid MA values
  }

  // Get MA20 from 5 bars ago
  const ma20FiveBarsAgo = currentIndex >= 5 && series[currentIndex - 5]?.MA20 > 0 
    ? series[currentIndex - 5].MA20 
    : latest.MA20

  // UP conditions:
  // - close > MA20
  // - MA20 > MA50
  // - MA20 > MA20 from 5 bars ago
  if (latest.close > latest.MA20 && latest.MA20 > latest.MA50 && latest.MA20 > ma20FiveBarsAgo) {
    return 'UP'
  }

  // DOWN conditions:
  // - close < MA20
  // - MA20 < MA50
  // - MA20 < MA20 from 5 bars ago
  if (latest.close < latest.MA20 && latest.MA20 < latest.MA50 && latest.MA20 < ma20FiveBarsAgo) {
    return 'DOWN'
  }

  // Otherwise: SIDEWAY
  return 'SIDEWAY'
}

/**
 * Classify volatility based on ATR14 / close ratio
 */
export function classifyVolatility(latest: IndicatorsPoint): VolatilityLevel {
  if (latest.close === 0 || latest.ATR14 === 0 || !latest.ATR14 || !latest.close) return 'MEDIUM'
  const volRatio = latest.ATR14 / latest.close

  if (volRatio < 0.01) {
    return 'LOW'
  } else if (volRatio <= 0.025) {
    return 'MEDIUM'
  } else {
    return 'HIGH'
  }
}

/**
 * Classify volume based on volume / VolMA20 ratio
 */
export function classifyVolume(latest: IndicatorsPoint, currentVolume: number): VolumeMode {
  if (latest.VolMA20 === 0) return 'NORMAL'
  const volRatio = currentVolume / latest.VolMA20

  if (volRatio < 0.8) {
    return 'LOW'
  } else if (volRatio <= 1.5) {
    return 'NORMAL'
  } else {
    return 'HIGH'
  }
}

/**
 * Detect support/resistance zones and trading zones
 */
export function detectZones(
  ohlcv: DailyBar[],
  indicators: IndicatorsSeries,
  trendMode: TrendMode,
  volumeMode: VolumeMode,
  volatility: VolatilityLevel
): Zones {
  if (ohlcv.length < 20) {
    // Not enough data, return default zones
    const latest = ohlcv[ohlcv.length - 1]
    const defaultSupport: [number, number] = [latest.low * 0.97, latest.low]
    const defaultResist: [number, number] = [latest.high, latest.high * 1.03]
    return {
      supportZone: defaultSupport,
      resistZone: defaultResist,
      pullbackZone: null,
      breakoutZone: null,
      tpZoneShort: defaultResist,
      slZone: [latest.low * 0.97, latest.low * 0.98],
    }
  }

  // Use last 20-30 bars for short-term support/resistance
  const lookback = Math.min(30, ohlcv.length)
  const recentBars = ohlcv.slice(-lookback)
  const recentLows = recentBars.map((b) => b.low)
  const recentHighs = recentBars.map((b) => b.high)

  const ST_low = Math.min(...recentLows)
  const ST_high = Math.max(...recentHighs)

  // Support and Resistance zones
  const supportZone: [number, number] = [ST_low, ST_low * 1.03]
  const resistZone: [number, number] = [ST_high * 0.97, ST_high]

  const latest = indicators[indicators.length - 1]
  const latestBar = ohlcv[ohlcv.length - 1]

  // PullbackZone (only if trendMode === "UP")
  let pullbackZone: [number, number] | null = null
  if (trendMode === 'UP') {
    const pullbackLower = latest.MA20 * 0.98
    const pullbackUpper = latest.MA20 * 1.02

    // Only valid if:
    // - price (latest close) is not below supportZone[0]
    // - volumeMode = "LOW" or "NORMAL"
    // - volatility != "HIGH"
    if (
      latest.close >= supportZone[0] &&
      (volumeMode === 'LOW' || volumeMode === 'NORMAL') &&
      volatility !== 'HIGH'
    ) {
      pullbackZone = [pullbackLower, pullbackUpper]
    }
  }

  // BreakoutZone
  let breakoutZone: [number, number] | null = null
  // Trigger breakout when:
  // - close > resistZone[1] * 1.01
  // - volumeMode = "HIGH"
  // - trendMode !== "DOWN"
  if (
    latest.close > resistZone[1] * 1.01 &&
    volumeMode === 'HIGH' &&
    trendMode !== 'DOWN'
  ) {
    breakoutZone = [resistZone[1], resistZone[1] * 1.03]
  }

  // Take-profit zone (short-term)
  let tpZoneShort: [number, number] | null = resistZone
  // If breakout is active and trendMode = "UP", can extend slightly
  if (breakoutZone && trendMode === 'UP') {
    const extendedTP = resistZone[1] * 1.05
    tpZoneShort = [resistZone[1], extendedTP]
  }

  // Stop-loss zone (3% below support)
  const slZone: [number, number] = [supportZone[0] * 0.97, supportZone[0]]

  return {
    supportZone,
    resistZone,
    pullbackZone,
    breakoutZone,
    tpZoneShort,
    slZone,
  }
}

/**
 * Evaluate risk level based on trend, volatility, volume, and price position
 */
export function evaluateRiskLevel(
  trendMode: TrendMode,
  volatility: VolatilityLevel,
  volumeMode: VolumeMode,
  latest: IndicatorsPoint,
  zones: Zones
): RiskLevel {
  const close = latest.close
  const ma20 = latest.MA20

  // LOW risk conditions:
  if (
    (trendMode === 'UP' || trendMode === 'SIDEWAY') &&
    volatility !== 'HIGH' &&
    volumeMode !== 'HIGH' &&
    (close >= zones.supportZone[0] && close <= zones.supportZone[1] ||
      (zones.pullbackZone && close >= zones.pullbackZone[0] && close <= zones.pullbackZone[1]))
  ) {
    return 'LOW'
  }

  // HIGH risk conditions:
  const distFromMA20 = Math.abs(close - ma20) / ma20

  if (
    (trendMode === 'DOWN' && close <= zones.supportZone[0] * 1.02) ||
    (volatility === 'HIGH' && volumeMode === 'HIGH' && close >= zones.resistZone[0]) ||
    distFromMA20 > 0.07 // price far from MA20, chasing
  ) {
    return 'HIGH'
  }

  // Otherwise: MEDIUM
  return 'MEDIUM'
}

/**
 * Evaluate trading signals
 */
export function evaluateSignals(
  latest: IndicatorsPoint,
  latestBar: DailyBar,
  zones: Zones,
  trendMode: TrendMode,
  riskLevel: RiskLevel,
  volumeMode: VolumeMode
): ShortTermSignals {
  const close = latest.close

  // hasPullbackLongSetup: trendMode = "UP" AND latest close inside pullbackZone
  const hasPullbackLongSetup =
    trendMode === 'UP' &&
    zones.pullbackZone !== null &&
    close >= zones.pullbackZone[0] &&
    close <= zones.pullbackZone[1]

  // hasBreakoutLongSetup: breakout condition is true
  const hasBreakoutLongSetup = zones.breakoutZone !== null

  // isNearSupport: close within 2% of supportZone[1]
  const distToSupport = (close - zones.supportZone[1]) / zones.supportZone[1]
  const isNearSupport = Math.abs(distToSupport) <= 0.02

  // isNearResistance: close within 2% of resistZone[0]
  const distToResist = (close - zones.resistZone[0]) / zones.resistZone[0]
  const isNearResistance = Math.abs(distToResist) <= 0.02

  // isDangerZone: riskLevel = "HIGH" AND (close >= resistZone[0] OR volumeMode = "HIGH")
  const isDangerZone =
    riskLevel === 'HIGH' && (close >= zones.resistZone[0] || volumeMode === 'HIGH')

  return {
    hasPullbackLongSetup,
    hasBreakoutLongSetup,
    isNearSupport,
    isNearResistance,
    isDangerZone,
  }
}

/**
 * Main function: Evaluate short-term analysis
 */
export function evaluateShortTermAnalysis(ohlcv: DailyBar[]): ShortTermAnalysis {
  if (ohlcv.length === 0) {
    throw new Error('OHLCV data is required')
  }

  // Compute indicators
  const indicators = computeIndicators(ohlcv)
  const latest = indicators[indicators.length - 1]
  const latestBar = ohlcv[ohlcv.length - 1]

  // Classify trend, volatility, volume
  const trendMode = classifyTrend(latest, indicators)
  const volatility = classifyVolatility(latest)
  const volumeMode = classifyVolume(latest, latestBar.volume)

  // Detect zones
  const zones = detectZones(ohlcv, indicators, trendMode, volumeMode, volatility)

  // Evaluate risk level
  const riskLevel = evaluateRiskLevel(trendMode, volatility, volumeMode, latest, zones)

  // Evaluate signals
  const signals = evaluateSignals(latest, latestBar, zones, trendMode, riskLevel, volumeMode)

  return {
    trendMode,
    volatility,
    volumeMode,
    supportZone: zones.supportZone,
    resistZone: zones.resistZone,
    pullbackZone: zones.pullbackZone,
    breakoutZone: zones.breakoutZone,
    tpZoneShort: zones.tpZoneShort,
    slZone: zones.slZone,
    riskLevel,
    signals,
  }
}

