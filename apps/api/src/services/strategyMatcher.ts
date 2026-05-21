import { DealMetrics } from './dealCalculator';

export interface LocationInsights {
  walkability?: {
    walkScore: number | null;
    transitScore: number | null;
    bikeScore: number | null;
  };
  safety?: {
    violentCrimeRate: number | null;
    propertyCrimeRate: number | null;
  };
  flood_risk?: {
    floodZone: string | null;
    floodRisk: string | null;
  };
  demographics?: {
    medianHouseholdIncome: number | null;
    population: number | null;
    populationGrowth?: number | null;
  };
}

export type ScoringDimension =
  | 'Cap Rate'
  | 'Cash Returns'
  | 'Cash Flow'
  | 'Location'
  | 'Safety'
  | 'Property';

export interface ScoreContribution {
  factor: string;
  value: string;
  points: number;
  explanation: string;
  dimension?: ScoringDimension;
}

// Per-dimension weight as a 0–100 percentage. 100 = full impact (raw matcher
// points are used as-is), 0 = ignored. Defaults mirror the frontend
// STRATEGY_EMPHASIS map so the existing emphasis radar becomes a real input
// to scoring instead of a decorative chart.
export interface StrategyWeights {
  cash_flow?: Partial<Record<ScoringDimension, number>>;
  appreciation?: Partial<Record<ScoringDimension, number>>;
  brrrr?: Partial<Record<ScoringDimension, number>>;
  turnkey?: Partial<Record<ScoringDimension, number>>;
  str?: Partial<Record<ScoringDimension, number>>;
  house_hack?: Partial<Record<ScoringDimension, number>>;
}

const DEFAULT_WEIGHTS: Record<string, Record<ScoringDimension, number>> = {
  cash_flow:    { 'Cap Rate': 100, 'Cash Returns': 60, 'Cash Flow': 40, Location: 5,   Safety: 5,  Property: 5   },
  appreciation: { 'Cap Rate': 60,  'Cash Returns': 5,  'Cash Flow': 5,  Location: 100, Safety: 5,  Property: 5   },
  brrrr:        { 'Cap Rate': 60,  'Cash Returns': 60, 'Cash Flow': 5,  Location: 5,   Safety: 40, Property: 60  },
  turnkey:      { 'Cap Rate': 40,  'Cash Returns': 5,  'Cash Flow': 60, Location: 5,   Safety: 5,  Property: 100 },
  str:          { 'Cap Rate': 5,   'Cash Returns': 80, 'Cash Flow': 5,  Location: 100, Safety: 5,  Property: 40  },
  house_hack:   { 'Cap Rate': 5,   'Cash Returns': 5,  'Cash Flow': 15, Location: 40,  Safety: 25, Property: 100 },
};

export interface StrategyScore {
  strategy: string;
  score: number;
  reason: string;
  baseline: number;
  contributions: ScoreContribution[];
}

export interface StrategyThresholds {
  cash_flow?: {
    minCapRate?: number;
    minCashOnCash?: number;
    minMonthlyCashFlow?: number;
  };
  appreciation?: {
    minWalkScore?: number;
    minMedianIncome?: number;
    maxCapRate?: number;
  };
  brrrr?: {
    maxYearBuilt?: number;
    minCapRate?: number;
    minCashOnCash?: number;
    maxCrimeRate?: number;
  };
  turnkey?: {
    minYearBuilt?: number;
    minMonthlyCashFlow?: number;
    minCapRate?: number;
  };
  str?: {
    minWalkScore?: number;
    minCashOnCash?: number;
  };
  house_hack?: {
    minWalkScore?: number;
    maxCrimeRate?: number;
    minMonthlyCashFlow?: number;
  };
}

const DEFAULTS = {
  cash_flow: { minCapRate: 8, minCashOnCash: 8, minMonthlyCashFlow: 200 },
  appreciation: { minWalkScore: 60, minMedianIncome: 60000, maxCapRate: 5 },
  brrrr: { maxYearBuilt: 1990, minCapRate: 8, minCashOnCash: 10, maxCrimeRate: 500 },
  turnkey: { minYearBuilt: 2015, minMonthlyCashFlow: 100, minCapRate: 6 },
  str: { minWalkScore: 70, minCashOnCash: 12 },
  house_hack: { minWalkScore: 60, maxCrimeRate: 350, minMonthlyCashFlow: 0 },
} as const;

// Closure that scales raw points by the active per-dimension weight before
// recording the contribution. Returns the *weighted* points so the caller's
// running score already reflects the user's emphasis settings.
function makeContribute(weights: Record<ScoringDimension, number>) {
  return function contribute(
    contributions: ScoreContribution[],
    factor: string,
    dimension: ScoringDimension,
    value: string,
    rawPoints: number,
    explanation: string,
  ): number {
    const weight = (weights[dimension] ?? 100) / 100;
    const points = Math.round(rawPoints * weight * 10) / 10;
    contributions.push({ factor, value, points, explanation, dimension });
    return points;
  };
}

function resolveWeights(
  strategyKey: keyof typeof DEFAULT_WEIGHTS,
  overrides?: Partial<Record<ScoringDimension, number>>,
): Record<ScoringDimension, number> {
  return { ...DEFAULT_WEIGHTS[strategyKey], ...(overrides ?? {}) };
}

export function calculateStrategyFit(
  metrics: DealMetrics,
  locationInsights?: LocationInsights,
  propertyType?: string,
  yearBuilt?: number,
  thresholds?: StrategyThresholds,
  weights?: StrategyWeights,
): StrategyScore[] {
  const scores: StrategyScore[] = [];

  const walkScore = locationInsights?.walkability?.walkScore;
  const medianIncome = locationInsights?.demographics?.medianHouseholdIncome;
  const crimeRate = locationInsights?.safety?.violentCrimeRate;
  const floodRisk = locationInsights?.flood_risk?.floodRisk;

  // Cash Flow Strategy
  {
    const t = { ...DEFAULTS.cash_flow, ...(thresholds?.cash_flow ?? {}) };
    const w = resolveWeights('cash_flow', weights?.cash_flow);
    const contribute = makeContribute(w);
    const baseline = 50;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const capExcellent = Math.max(t.minCapRate + 2, t.minCapRate * 1.25);
    const capWeak = Math.max(0, t.minCapRate - 3);
    if (metrics.capRate >= capExcellent)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 25, `Excellent — exceeds ${capExcellent.toFixed(1)}%`);
    else if (metrics.capRate >= t.minCapRate)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 15, `Meets ${t.minCapRate}% target`);
    else if (metrics.capRate < capWeak)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, -20, `Below ${capWeak.toFixed(1)}% — weak for cash flow`);
    else
      contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 0, `Between ${capWeak.toFixed(1)}–${t.minCapRate}% — moderate`);

    const cocExcellent = Math.max(t.minCashOnCash + 2, t.minCashOnCash * 1.25);
    const cocWeak = Math.max(0, t.minCashOnCash - 4);
    if (metrics.cashOnCashReturn >= cocExcellent)
      score += contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 15, 'Strong return on cash invested');
    else if (metrics.cashOnCashReturn >= t.minCashOnCash)
      score += contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 10, `Meets ${t.minCashOnCash}% target`);
    else if (metrics.cashOnCashReturn < cocWeak)
      score += contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, -15, `Below ${cocWeak.toFixed(1)}% — poor return on cash`);
    else
      contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 0, `Between ${cocWeak.toFixed(1)}–${t.minCashOnCash}% — moderate`);

    const cfStrong = t.minMonthlyCashFlow + 100;
    if (metrics.monthlyCashFlow >= cfStrong)
      score += contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 10, 'Strong positive cash flow');
    else if (metrics.monthlyCashFlow >= t.minMonthlyCashFlow)
      score += contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 5, `Meets $${t.minMonthlyCashFlow}/mo target`);
    else if (metrics.monthlyCashFlow < 0)
      score += contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, -20, 'Negative — losing money monthly');
    else
      contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 0, `Positive but below $${t.minMonthlyCashFlow}/mo target`);

    scores.push({
      strategy: 'Cash Flow',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Cap rate: ${metrics.capRate}%, Cash-on-cash: ${metrics.cashOnCashReturn}%, Monthly cash flow: $${metrics.monthlyCashFlow}`,
      baseline,
      contributions: c,
    });
  }

  // Appreciation Strategy
  {
    const t = { ...DEFAULTS.appreciation, ...(thresholds?.appreciation ?? {}) };
    const w = resolveWeights('appreciation', weights?.appreciation);
    const contribute = makeContribute(w);
    const baseline = 50;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const walkExcellent = Math.min(100, t.minWalkScore + 10);
    const walkModerate = Math.max(0, t.minWalkScore - 10);
    if (walkScore != null && walkScore >= walkExcellent)
      score += contribute(c, 'Walk Score', 'Location', `${walkScore}`, 20, `Highly walkable (${walkExcellent}+) — desirable location`);
    else if (walkScore != null && walkScore >= walkModerate)
      score += contribute(c, 'Walk Score', 'Location', `${walkScore}`, 10, `Moderately walkable (${walkModerate}+)`);
    else if (walkScore != null)
      contribute(c, 'Walk Score', 'Location', `${walkScore}`, 0, `Below ${walkModerate} — limited appreciation signal`);

    const incomeStrong = t.minMedianIncome + 15000;
    const incomeWeak = Math.max(0, t.minMedianIncome - 20000);
    if (medianIncome && medianIncome >= incomeStrong)
      score += contribute(c, 'Median Income', 'Location', `$${medianIncome.toLocaleString()}`, 15, `High-income area ($${incomeStrong.toLocaleString()}+)`);
    else if (medianIncome && medianIncome >= t.minMedianIncome)
      score += contribute(c, 'Median Income', 'Location', `$${medianIncome.toLocaleString()}`, 10, `Meets $${t.minMedianIncome.toLocaleString()} target`);
    else if (medianIncome && medianIncome < incomeWeak)
      score += contribute(c, 'Median Income', 'Location', `$${medianIncome.toLocaleString()}`, -15, `Below $${incomeWeak.toLocaleString()} — lower appreciation potential`);
    else if (medianIncome)
      contribute(c, 'Median Income', 'Location', `$${medianIncome.toLocaleString()}`, 0, `Between $${incomeWeak.toLocaleString()}–$${t.minMedianIncome.toLocaleString()} — moderate`);

    const capHigh = t.maxCapRate + 3;
    if (metrics.capRate <= t.maxCapRate)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 15, `Low cap rate (≤${t.maxCapRate}%) signals appreciation market`);
    else if (metrics.capRate >= capHigh)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, -10, `High cap rate (≥${capHigh}%) — cash flow market, not appreciation`);
    else
      contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 0, 'Moderate cap rate');

    scores.push({
      strategy: 'Appreciation',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Walkability: ${walkScore || 'N/A'}, Median income: $${medianIncome?.toLocaleString() || 'N/A'}, Cap rate: ${metrics.capRate}%`,
      baseline,
      contributions: c,
    });
  }

  // BRRRR Strategy
  {
    const t = { ...DEFAULTS.brrrr, ...(thresholds?.brrrr ?? {}) };
    const w = resolveWeights('brrrr', weights?.brrrr);
    const contribute = makeContribute(w);
    const baseline = 50;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const newishYear = t.maxYearBuilt + 20;
    if (yearBuilt && yearBuilt < t.maxYearBuilt)
      score += contribute(c, 'Property Age', 'Property', `Built ${yearBuilt}`, 15, `Older than ${t.maxYearBuilt} — likely rehab opportunity`);
    else if (yearBuilt && yearBuilt > newishYear)
      score += contribute(c, 'Property Age', 'Property', `Built ${yearBuilt}`, -10, `Newer than ${newishYear} — limited rehab value-add`);
    else if (yearBuilt)
      contribute(c, 'Property Age', 'Property', `Built ${yearBuilt}`, 0, 'Moderate age — some rehab potential');

    if (metrics.capRate >= t.minCapRate)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 15, `Strong returns (≥${t.minCapRate}%) after rehab`);
    else
      contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 0, `Below ${t.minCapRate}% — moderate for BRRRR`);

    if (metrics.cashOnCashReturn >= t.minCashOnCash)
      score += contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 15, `Excellent recycled capital returns (≥${t.minCashOnCash}%)`);
    else
      contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 0, `Below ${t.minCashOnCash}% — moderate for BRRRR`);

    const safeCrime = Math.max(0, t.maxCrimeRate - 200);
    if (crimeRate && crimeRate > t.maxCrimeRate)
      score += contribute(c, 'Crime Rate', 'Safety', `${crimeRate}`, -15, `Above ${t.maxCrimeRate} — risky for rehab investment`);
    else if (crimeRate && crimeRate < safeCrime)
      score += contribute(c, 'Crime Rate', 'Safety', `${crimeRate}`, 10, `Below ${safeCrime} — safe for rehab investment`);
    else if (crimeRate != null)
      contribute(c, 'Crime Rate', 'Safety', `${crimeRate}`, 0, 'Moderate crime level');

    scores.push({
      strategy: 'BRRRR',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Age: ${yearBuilt ? `${2026 - yearBuilt} years` : 'N/A'}, Cap rate: ${metrics.capRate}%, Crime rate: ${crimeRate || 'N/A'}`,
      baseline,
      contributions: c,
    });
  }

  // Turnkey Strategy
  {
    const t = { ...DEFAULTS.turnkey, ...(thresholds?.turnkey ?? {}) };
    const w = resolveWeights('turnkey', weights?.turnkey);
    const contribute = makeContribute(w);
    const baseline = 50;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const olderYear = t.minYearBuilt - 10;
    const tooOldYear = t.minYearBuilt - 35;
    if (yearBuilt && yearBuilt >= t.minYearBuilt)
      score += contribute(c, 'Year Built', 'Property', `${yearBuilt}`, 20, `${t.minYearBuilt}+ — minimal work needed`);
    else if (yearBuilt && yearBuilt >= olderYear)
      score += contribute(c, 'Year Built', 'Property', `${yearBuilt}`, 10, 'Relatively modern');
    else if (yearBuilt && yearBuilt < tooOldYear)
      score += contribute(c, 'Year Built', 'Property', `${yearBuilt}`, -15, `Older than ${tooOldYear} — likely needs work`);
    else if (yearBuilt)
      contribute(c, 'Year Built', 'Property', `${yearBuilt}`, 0, 'Moderate age');

    if (metrics.monthlyCashFlow >= t.minMonthlyCashFlow)
      score += contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 15, `Meets $${t.minMonthlyCashFlow}/mo from move-in`);
    else
      contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 0, `Below $${t.minMonthlyCashFlow}/mo target`);

    if (metrics.capRate >= t.minCapRate)
      score += contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 10, `Meets ${t.minCapRate}% target`);
    else
      contribute(c, 'Cap Rate', 'Cap Rate', `${metrics.capRate}%`, 0, `Below ${t.minCapRate}% target`);

    if (floodRisk === 'Low' || floodRisk === 'Minimal')
      score += contribute(c, 'Flood Risk', 'Safety', floodRisk, 10, 'Low risk — good for turnkey');
    else if (floodRisk === 'High')
      score += contribute(c, 'Flood Risk', 'Safety', floodRisk, -15, 'High flood risk — maintenance concern');
    else if (floodRisk)
      contribute(c, 'Flood Risk', 'Safety', floodRisk, 0, 'Moderate flood risk');

    scores.push({
      strategy: 'Turnkey',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Year built: ${yearBuilt || 'N/A'}, Cash flow: $${metrics.monthlyCashFlow}, Flood risk: ${floodRisk || 'N/A'}`,
      baseline,
      contributions: c,
    });
  }

  // Short-Term Rental Strategy
  {
    const t = { ...DEFAULTS.str, ...(thresholds?.str ?? {}) };
    const w = resolveWeights('str', weights?.str);
    const contribute = makeContribute(w);
    const baseline = 40;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const walkExcellent = Math.min(100, t.minWalkScore + 10);
    if (walkScore != null && walkScore >= walkExcellent)
      score += contribute(c, 'Walk Score', 'Location', `${walkScore}`, 25, `Excellent walkability (${walkExcellent}+) — ideal for guests`);
    else if (walkScore != null && walkScore >= t.minWalkScore)
      score += contribute(c, 'Walk Score', 'Location', `${walkScore}`, 15, `Meets ${t.minWalkScore}+ target for STR`);
    else if (walkScore != null)
      contribute(c, 'Walk Score', 'Location', `${walkScore}`, 0, `Below ${t.minWalkScore} — less appealing for STR`);

    if (metrics.cashOnCashReturn >= t.minCashOnCash)
      score += contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 20, `Meets ${t.minCashOnCash}% — STR premium`);
    else
      contribute(c, 'Cash-on-Cash', 'Cash Returns', `${metrics.cashOnCashReturn}%`, 0, `Below ${t.minCashOnCash}% target for STR`);

    if (propertyType?.toLowerCase().includes('condo'))
      score += contribute(c, 'Property Type', 'Property', propertyType, 10, 'Condos perform well as STR');
    else if (propertyType)
      contribute(c, 'Property Type', 'Property', propertyType, 0, 'Not a condo — neutral for STR');

    scores.push({
      strategy: 'Short-Term Rental',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Walkability: ${walkScore || 'N/A'}, Cash-on-cash: ${metrics.cashOnCashReturn}%, Property type: ${propertyType || 'N/A'}`,
      baseline,
      contributions: c,
    });
  }

  // House Hacking Strategy
  {
    const t = { ...DEFAULTS.house_hack, ...(thresholds?.house_hack ?? {}) };
    const w = resolveWeights('house_hack', weights?.house_hack);
    const contribute = makeContribute(w);
    const baseline = 30;
    let score = baseline;
    const c: ScoreContribution[] = [];

    const isMultiFamily = propertyType?.toLowerCase().includes('multi') ||
      propertyType?.toLowerCase().includes('duplex') ||
      propertyType?.toLowerCase().includes('triplex') ||
      propertyType?.toLowerCase().includes('fourplex');

    if (isMultiFamily)
      score += contribute(c, 'Property Type', 'Property', propertyType!, 40, 'Multi-family — core house hack requirement');
    else if (propertyType)
      contribute(c, 'Property Type', 'Property', propertyType, 0, 'Single-family — limited house hack potential');

    if (walkScore != null && walkScore >= t.minWalkScore)
      score += contribute(c, 'Walk Score', 'Location', `${walkScore}`, 15, `Meets ${t.minWalkScore}+ — attractive to tenants`);
    else if (walkScore != null)
      contribute(c, 'Walk Score', 'Location', `${walkScore}`, 0, `Below ${t.minWalkScore}`);

    if (crimeRate && crimeRate < t.maxCrimeRate)
      score += contribute(c, 'Crime Rate', 'Safety', `${crimeRate}`, 10, `Below ${t.maxCrimeRate} — good for owner-occupant`);
    else if (crimeRate != null)
      contribute(c, 'Crime Rate', 'Safety', `${crimeRate}`, 0, `At/above ${t.maxCrimeRate} — consider carefully`);

    const cfFloor = t.minMonthlyCashFlow - 200;
    if (metrics.monthlyCashFlow >= cfFloor)
      score += contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 5, 'Acceptable for owner-occupied strategy');
    else
      contribute(c, 'Monthly Cash Flow', 'Cash Flow', `$${metrics.monthlyCashFlow}`, 0, 'Significant negative cash flow');

    scores.push({
      strategy: 'House Hacking',
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: `Property type: ${propertyType || 'N/A'}, Walkability: ${walkScore || 'N/A'}, Cash flow: $${metrics.monthlyCashFlow}`,
      baseline,
      contributions: c,
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}

export function getBestStrategy(
  metrics: DealMetrics,
  locationInsights?: LocationInsights,
  propertyType?: string,
  yearBuilt?: number,
  thresholds?: StrategyThresholds,
  weights?: StrategyWeights,
): { strategy: string; score: number; allScores: StrategyScore[] } {
  const scores = calculateStrategyFit(metrics, locationInsights, propertyType, yearBuilt, thresholds, weights);
  const best = scores[0];

  return {
    strategy: best.strategy,
    score: best.score,
    allScores: scores,
  };
}
