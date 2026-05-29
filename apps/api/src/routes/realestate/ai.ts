import { Router } from 'express';
import { analyzeDeal } from '../../services/dealCalculator';
import {
  getBestStrategy,
  calculateStrategyFit,
  StrategyThresholds,
  StrategyWeights,
  ScoringDimension,
} from '../../services/strategyMatcher';
import { getWalkScore } from '../../services/walkscore';
import { getCrimeStats } from '../../services/fbi';
import { getFloodZone } from '../../services/fema';

const router = Router();

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

async function askPerplexity(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('Perplexity API key not configured');

  const res = await fetch(PERPLEXITY_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// --- AI Market Discovery ---

router.post('/discover', async (req, res) => {
  const { query } = req.body;

  if (!query?.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const systemPrompt = `You are an expert real estate investment analyst with deep knowledge of US housing markets, rental yields, cap rates, appreciation trends, and demographic shifts.

When answering queries:
- Always include specific data points: median home prices, estimated cap rates, rent-to-price ratios, population growth rates, job growth
- Reference specific zip codes, cities, or metro areas with numbers
- Compare markets when relevant
- Include both opportunities AND risks for each market mentioned
- Format your response with clear sections using markdown headers (##)
- When discussing cap rates, explain assumptions (e.g., estimated expenses at 40-50% of gross rent)
- Include a "Markets to Watch" section with 3-5 specific locations
- End with a "Key Risks" section

Base your analysis on the most recent available data. Be specific — investors need actionable numbers, not generalities.`;

    const response = await askPerplexity(systemPrompt, query);
    res.json({ query, response });
  } catch (err) {
    console.error('[ai:discover]', err);
    res.status(500).json({ error: 'AI discovery failed' });
  }
});

// --- AI Deal Screening ---

router.post('/screen', async (req, res) => {
  const { criteria } = req.body;

  if (!criteria?.trim()) {
    return res.status(400).json({ error: 'Screening criteria required' });
  }

  try {
    const systemPrompt = `You are a real estate deal screening engine. Given investment criteria, identify and rank the best markets and property types that match.

For each recommended market, provide:
1. **Location** (city, state, zip codes)
2. **Median Home Price** (current)
3. **Estimated Cap Rate** (based on typical rents and expenses)
4. **Rent-to-Price Ratio** (monthly rent / purchase price as percentage)
5. **Population & Job Growth** (recent trends)
6. **Landlord Friendliness** (eviction laws, tenant protections)
7. **Risk Score** (Low/Medium/High with explanation)
8. **Why It Matches** (specific connection to the stated criteria)

Format as a ranked list from best match to least. Include at least 5 markets.
End with a "Screening Summary" that compares the top 3 picks.
Use markdown formatting with ## headers and **bold** for key metrics.`;

    const response = await askPerplexity(systemPrompt, criteria);
    res.json({ criteria, response });
  } catch (err) {
    console.error('[ai:screen]', err);
    res.status(500).json({ error: 'AI screening failed' });
  }
});

// --- AI Investment Thesis ---

router.post('/thesis', async (req, res) => {
  const { propertyAddress, metrics, inputs } = req.body;

  if (!propertyAddress || !metrics) {
    return res.status(400).json({ error: 'Property address and metrics are required' });
  }

  try {
    const systemPrompt = `You are a senior real estate investment analyst writing a formal investment thesis for a private equity review committee. Your analysis must be thorough, data-driven, and structured.

Format your thesis with these exact sections using markdown:

## Executive Summary
2-3 sentence verdict on the deal.

## Opportunity Assessment
- What makes this property/market attractive
- Growth catalysts (infrastructure, employers, demographic shifts)
- Comparable recent transactions in the area

## Financial Analysis
- Commentary on the provided metrics (cap rate, cash-on-cash, cash flow)
- How these compare to market benchmarks
- Sensitivity analysis: what happens if rents drop 10%, vacancy rises to 15%, or rates increase 1%

## Risk Factors
Rate each risk as Low/Medium/High:
- Market risk (local economy, oversupply)
- Tenant risk (vacancy, quality, turnover costs)
- Regulatory risk (rent control, zoning changes)
- Interest rate risk (refinancing exposure)
- Physical risk (age, deferred maintenance, natural disasters)

## Exit Strategies
Analyze at least 3 exit scenarios:
1. Hold long-term (10+ years)
2. Sell after value-add (3-5 years)
3. Cash-out refinance

## Recommendation
Clear BUY / HOLD / PASS verdict with 1-2 sentence justification.`;

    const userPrompt = `Analyze this investment property:

**Property:** ${propertyAddress}
**Purchase Price:** $${inputs.purchasePrice.toLocaleString()}
**Down Payment:** ${inputs.downPaymentPct}%
**Interest Rate:** ${inputs.interestRate}%
**Loan Term:** ${inputs.loanTermYears} years
**Expected Monthly Rent:** $${inputs.expectedMonthlyRent.toLocaleString()}
**Monthly HOA:** $${inputs.hoaMonthly}
**Annual Property Taxes:** $${inputs.propertyTaxesAnnual.toLocaleString()}
**Annual Insurance:** $${inputs.insuranceAnnual.toLocaleString()}
**Vacancy Rate:** ${inputs.vacancyRatePct}%

**Calculated Metrics:**
- Cap Rate: ${metrics.capRate}%
- Cash-on-Cash Return: ${metrics.cashOnCashReturn}%
- Monthly Cash Flow: $${metrics.monthlyCashFlow.toLocaleString()}
- Annual Cash Flow: $${metrics.annualCashFlow.toLocaleString()}
- NOI: $${metrics.noi.toLocaleString()}
- Gross Rent Multiplier: ${metrics.grossRentMultiplier}
- Total Cash Needed: $${metrics.totalCashNeeded.toLocaleString()}
- Investment Score: ${metrics.investmentScore}/100
- 5-Year Projected Value: $${metrics.appreciation.year5.value.toLocaleString()}
- 10-Year Projected Value: $${metrics.appreciation.year10.value.toLocaleString()}

Provide a comprehensive investment thesis.`;

    const response = await askPerplexity(systemPrompt, userPrompt);
    res.json({ propertyAddress, response });
  } catch (err) {
    console.error('[ai:thesis]', err);
    res.status(500).json({ error: 'AI thesis generation failed' });
  }
});

// --- AI Property Suggestions ---

router.post('/suggestions', async (req, res) => {
  const { criteria } = req.body;

  try {
    const systemPrompt = `You are a real estate investment data provider. Given investment criteria (or no criteria for general suggestions), return exactly 8 real investable properties currently on the market or recently sold.

You MUST respond with ONLY a valid JSON array — no markdown, no explanation, no code fences. Each element must have exactly these fields:

[
  {
    "property_address": "Full street address, City, State ZIP",
    "purchase_price": 250000,
    "expected_monthly_rent": 1800,
    "property_taxes_annual": 3000,
    "insurance_annual": 1500,
    "hoa_monthly": 0,
    "interest_rate": 6.875,
    "down_payment_pct": 20,
    "loan_term_years": 30,
    "vacancy_rate_pct": 5,
    "monthly_expenses": 200,
    "property_type": "Single Family",
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1400,
    "year_built": 2005,
    "why": "Strong rental market near university with low vacancy",
    "image_url": "https://photos.zillowstatic.com/fp/abc123-p_e.jpg",
    "zillow_url": "https://www.zillow.com/homedetails/123-Main-St/12345_zpid/",
    "realtor_url": "https://www.realtor.com/realestateandhomes-detail/123-Main-St",
    "latitude": 30.2672,
    "longitude": -97.7431
  }
]

Rules:
- Use current 2026 mortgage rates (approximately 6.5-7.0% for 30-year fixed)
- Use realistic, current market prices for the specific locations
- Estimate rent based on actual comparable rents in that market
- Property taxes should be realistic for the location (typically 0.8-2.5% of value depending on state)
- Insurance should be realistic ($1,200-$3,000/year for most properties)
- Include a mix of price ranges and locations unless criteria specify otherwise
- HOA should be 0 for single family, $100-$400 for condos/townhomes
- monthly_expenses covers maintenance/repairs, estimate $150-$300/month
- The "why" field should be a brief 1-sentence investment rationale
- For image_url: provide a direct image URL for the property photo from a listing site (Zillow, Realtor, Redfin, etc). Try to find the actual listing photo URL. If you cannot find one, use an empty string ""
- For zillow_url: provide the direct Zillow listing URL for this property. If unavailable, use an empty string ""
- For realtor_url: provide the direct Realtor.com listing URL for this property. If unavailable, use an empty string ""
- For latitude/longitude: provide the approximate GPS coordinates of the property location
- Return ONLY the JSON array, nothing else`;

    const userPrompt = criteria?.trim()
      ? `Find 8 investment properties matching: ${criteria}`
      : 'Find 8 diverse investment properties across different US markets with good cash flow potential. Include a mix of affordable Midwest/South markets and moderate coastal markets.';

    const rawResponse = await askPerplexity(systemPrompt, userPrompt);

    let properties;
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      properties = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
    } catch {
      console.error('[ai:suggestions] Failed to parse JSON:', rawResponse.slice(0, 200));
      return res.status(500).json({ error: 'Failed to parse property suggestions' });
    }

    // Enrich with metrics, strategy fit, and location insights
    const enrichedProperties = await Promise.all(
      properties.map(async (prop: any) => {
        try {
          // Calculate deal metrics
          const metrics = analyzeDeal({
            purchasePrice: prop.purchase_price,
            downPaymentPct: prop.down_payment_pct || 20,
            interestRate: prop.interest_rate || 7.0,
            loanTermYears: prop.loan_term_years || 30,
            expectedMonthlyRent: prop.expected_monthly_rent || 0,
            monthlyExpenses: prop.monthly_expenses || 200,
            propertyTaxesAnnual: prop.property_taxes_annual || 0,
            insuranceAnnual: prop.insurance_annual || 1200,
            hoaMonthly: prop.hoa_monthly || 0,
            vacancyRatePct: prop.vacancy_rate_pct || 5,
          });

          const lat = prop.latitude;
          const lon = prop.longitude;
          const stateMatch = prop.property_address?.match(/,\s*([A-Z]{2})\s+\d{5}/);
          const state = stateMatch?.[1] || '';

          // Fetch location insights in parallel
          const [walkScore, crimeData, floodData] = await Promise.all([
            lat && lon ? getWalkScore(lat, lon, prop.property_address).catch(() => ({ walkScore: null, transitScore: null, bikeScore: null })) : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),
            state ? getCrimeStats(state).catch(() => ({ violentCrimeRate: null, propertyCrimeRate: null })) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
            lat && lon ? getFloodZone(lat, lon).catch(() => ({ floodZone: null, floodRisk: null })) : Promise.resolve({ floodZone: null, floodRisk: null }),
          ]);

          const locationInsights = {
            walkability: walkScore,
            safety: crimeData,
            flood_risk: floodData,
          };

          // Calculate strategy fit
          const strategyFit = getBestStrategy(
            metrics,
            locationInsights,
            prop.property_type,
            prop.year_built
          );

          return {
            ...prop,
            metrics,
            location_insights: locationInsights,
            best_strategy: strategyFit.strategy,
            strategy_score: strategyFit.score,
            all_strategy_scores: strategyFit.allScores,
          };
        } catch (err) {
          console.error('[property-enrichment]', err);
          return prop;
        }
      })
    );

    // Group by best strategy
    const byStrategy: Record<string, any[]> = {};
    enrichedProperties.forEach((prop) => {
      const strategy = prop.best_strategy || 'Uncategorized';
      if (!byStrategy[strategy]) {
        byStrategy[strategy] = [];
      }
      byStrategy[strategy].push(prop);
    });

    res.json({
      properties: enrichedProperties,
      grouped_by_strategy: byStrategy,
      criteria: criteria || null,
    });
  } catch (err) {
    console.error('[ai:suggestions]', err);
    res.status(500).json({ error: 'Failed to generate property suggestions' });
  }
});

// --- Strategy Definitions ---
interface InvestmentStrategy {
  name: string;
  key: string;
  description: string;
  targetMetrics: {
    minCapRate?: number;
    maxCapRate?: number;
    minCashOnCash?: number;
    minMonthlyCashFlow?: number;
    maxGRM?: number;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    appreciationPotential?: 'low' | 'medium' | 'high';
  };
  locationPreferences: {
    minWalkScore?: number;
    maxCrimeRate?: number;
    minMedianIncome?: number;
    maxFloodRisk?: string;
    populationGrowth?: 'stable' | 'growing' | 'booming';
  };
}

// Defaults are kept aligned with strategyMatcher.ts so the customizable knobs
// the user sees on the strategy detail page are the same numbers the scoring
// engine actually consumes.
const STRATEGIES: InvestmentStrategy[] = [
  {
    name: 'Cash Flow',
    key: 'cash_flow',
    description: 'Properties generating strong monthly cash flow from day one',
    targetMetrics: {
      minCapRate: 8,
      minCashOnCash: 8,
      minMonthlyCashFlow: 200,
      maxGRM: 12,
    },
    locationPreferences: {
      minMedianIncome: 40000,
      maxFloodRisk: 'Moderate',
    },
  },
  {
    name: 'Appreciation',
    key: 'appreciation',
    description: 'Properties in high-growth markets with strong appreciation potential',
    targetMetrics: {
      maxCapRate: 5,
      appreciationPotential: 'high',
    },
    locationPreferences: {
      minWalkScore: 60,
      minMedianIncome: 60000,
      populationGrowth: 'booming',
    },
  },
  {
    name: 'BRRRR',
    key: 'brrrr',
    description: 'Buy, Rehab, Rent, Refinance, Repeat - value-add opportunities',
    targetMetrics: {
      minCapRate: 8,
      minCashOnCash: 10,
      maxYearBuilt: 1990,
    },
    locationPreferences: {
      minMedianIncome: 45000,
      maxCrimeRate: 500,
    },
  },
  {
    name: 'Turnkey',
    key: 'turnkey',
    description: 'Move-in ready properties requiring minimal work',
    targetMetrics: {
      minCapRate: 6,
      minMonthlyCashFlow: 100,
      minYearBuilt: 2015,
    },
    locationPreferences: {
      minWalkScore: 40,
      maxFloodRisk: 'Low',
    },
  },
  {
    name: 'Short-Term Rental',
    key: 'str',
    description: 'Properties ideal for Airbnb/VRBO with high tourism potential',
    targetMetrics: {
      minCashOnCash: 12,
    },
    locationPreferences: {
      minWalkScore: 70,
      populationGrowth: 'growing',
    },
  },
  {
    name: 'House Hacking',
    key: 'house_hack',
    description: 'Multi-unit properties to live in one unit and rent the others',
    targetMetrics: {
      minMonthlyCashFlow: 0,
    },
    locationPreferences: {
      minWalkScore: 60,
      maxCrimeRate: 350,
    },
  },
];

// Maps an InvestmentStrategy.targetMetrics + locationPreferences override blob
// (the shape the frontend sends) to the StrategyThresholds shape consumed by
// the scoring engine. Per-strategy because the same knob can mean different
// things to different strategies.
function buildThresholds(
  strategyKey: string,
  targetMetrics?: Partial<InvestmentStrategy['targetMetrics']>,
  locationPreferences?: Partial<InvestmentStrategy['locationPreferences']>,
): StrategyThresholds {
  const t = targetMetrics ?? {};
  const l = locationPreferences ?? {};
  switch (strategyKey) {
    case 'cash_flow':
      return {
        cash_flow: {
          minCapRate: t.minCapRate,
          minCashOnCash: t.minCashOnCash,
          minMonthlyCashFlow: t.minMonthlyCashFlow,
        },
      };
    case 'appreciation':
      return {
        appreciation: {
          maxCapRate: t.maxCapRate,
          minWalkScore: l.minWalkScore,
          minMedianIncome: l.minMedianIncome,
        },
      };
    case 'brrrr':
      return {
        brrrr: {
          minCapRate: t.minCapRate,
          minCashOnCash: t.minCashOnCash,
          maxYearBuilt: t.maxYearBuilt,
          maxCrimeRate: l.maxCrimeRate,
        },
      };
    case 'turnkey':
      return {
        turnkey: {
          minCapRate: t.minCapRate,
          minMonthlyCashFlow: t.minMonthlyCashFlow,
          minYearBuilt: t.minYearBuilt,
        },
      };
    case 'str':
      return {
        str: {
          minCashOnCash: t.minCashOnCash,
          minWalkScore: l.minWalkScore,
        },
      };
    case 'house_hack':
      return {
        house_hack: {
          minMonthlyCashFlow: t.minMonthlyCashFlow,
          minWalkScore: l.minWalkScore,
          maxCrimeRate: l.maxCrimeRate,
        },
      };
    default:
      return {};
  }
}

function buildWeights(
  strategyKey: string,
  weightOverrides?: Partial<Record<ScoringDimension, number>>,
): StrategyWeights {
  if (!weightOverrides) return {};
  switch (strategyKey) {
    case 'cash_flow':    return { cash_flow: weightOverrides };
    case 'appreciation': return { appreciation: weightOverrides };
    case 'brrrr':        return { brrrr: weightOverrides };
    case 'turnkey':      return { turnkey: weightOverrides };
    case 'str':          return { str: weightOverrides };
    case 'house_hack':   return { house_hack: weightOverrides };
    default:             return {};
  }
}

function mergeStrategyOverrides(
  base: InvestmentStrategy,
  targetMetrics?: Partial<InvestmentStrategy['targetMetrics']>,
  locationPreferences?: Partial<InvestmentStrategy['locationPreferences']>,
): InvestmentStrategy {
  return {
    ...base,
    targetMetrics: { ...base.targetMetrics, ...(targetMetrics ?? {}) },
    locationPreferences: { ...base.locationPreferences, ...(locationPreferences ?? {}) },
  };
}

// --- AI Strategy-Based Suggestions ---

router.post('/suggestions-by-strategy', async (req, res) => {
  const {
    strategy,
    location,
    count = 8,
    targetMetrics: targetMetricsOverride,
    locationPreferences: locationPreferencesOverride,
  } = req.body;

  try {
    const baseStrategy = STRATEGIES.find((s) => s.key === strategy);
    if (!baseStrategy) {
      return res.status(400).json({ error: 'Invalid strategy. Must be one of: ' + STRATEGIES.map(s => s.key).join(', ') });
    }
    const targetStrategy = mergeStrategyOverrides(
      baseStrategy,
      targetMetricsOverride,
      locationPreferencesOverride,
    );

    const systemPrompt = `You are a real estate investment data provider specializing in ${targetStrategy.name} investment properties.

${targetStrategy.description}

TARGET METRICS for ${targetStrategy.name}:
${Object.entries(targetStrategy.targetMetrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

LOCATION PREFERENCES:
${Object.entries(targetStrategy.locationPreferences).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

You MUST respond with ONLY a valid JSON array — no markdown, no explanation, no code fences. Return exactly ${count} properties that match the ${targetStrategy.name} strategy.

Each element must have exactly these fields:

[
  {
    "property_address": "Full street address, City, State ZIP",
    "purchase_price": 250000,
    "expected_monthly_rent": 1800,
    "property_taxes_annual": 3000,
    "insurance_annual": 1500,
    "hoa_monthly": 0,
    "interest_rate": 6.875,
    "down_payment_pct": 20,
    "loan_term_years": 30,
    "vacancy_rate_pct": 5,
    "monthly_expenses": 200,
    "property_type": "Single Family",
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1400,
    "year_built": 2005,
    "strategy_fit": "Brief 1-sentence explanation of why this property fits the ${targetStrategy.name} strategy",
    "estimated_rehab_cost": 0,
    "image_url": "https://photos.zillowstatic.com/fp/abc123-p_e.jpg",
    "zillow_url": "https://www.zillow.com/homedetails/123-Main-St/12345_zpid/",
    "realtor_url": "https://www.realtor.com/realestateandhomes-detail/123-Main-St",
    "latitude": 30.2672,
    "longitude": -97.7431
  }
]

SPECIFIC STRATEGY REQUIREMENTS:

${strategy === 'cash_flow' ? `
- Focus on Midwest and South markets with low prices and high rent ratios
- Target cap rates of 8%+ and monthly cash flow of $200+
- Look for working-class neighborhoods with stable employment
- Single-family homes or small multi-family (2-4 units)
` : ''}

${strategy === 'appreciation' ? `
- Focus on coastal markets, tech hubs, and high-growth metros
- Properties near major employers, universities, or infrastructure projects
- Neighborhoods with rising home values and gentrification indicators
- May have lower initial cash flow but strong 5-10 year appreciation potential
` : ''}

${strategy === 'brrrr' ? `
- Focus on properties priced 20-40% below market value
- Distressed properties, foreclosures, or outdated homes in good locations
- Set "estimated_rehab_cost" to realistic renovation budget ($15k-$60k)
- After-repair value (ARV) should be significantly higher than purchase + rehab
- Strong rent potential after renovation
` : ''}

${strategy === 'turnkey' ? `
- Recently renovated or new construction (built after 2010)
- Properties marketed as "investor-ready" or "tenant-occupied"
- Move-in ready with no major repairs needed
- Set "estimated_rehab_cost" to 0 or minimal ($0-$5k)
- Slightly lower returns but minimal headaches
` : ''}

${strategy === 'str' ? `
- Properties in tourist destinations, beach towns, mountain areas, or major cities
- Near attractions, downtown areas, or conference centers
- 2+ bedrooms ideal for vacation rentals
- Estimate rent as potential monthly Airbnb income (typically 2-3x long-term rent)
- Check local STR regulations in the "strategy_fit" if restrictive
` : ''}

${strategy === 'house_hack' ? `
- Multi-family properties (duplex, triplex, fourplex)
- Or single-family homes with ADU/basement apartment potential
- Owner can live in one unit and rent others to offset mortgage
- FHA-friendly (3.5% down for owner-occupied multi-family)
- Focus on neighborhoods where owner would actually want to live
` : ''}

Rules:
- Use current 2026 mortgage rates (6.5-7.0% for 30-year fixed)
- All properties must be real, current listings or recently sold properties
- Use realistic market prices and rents for the specific locations
- Property taxes: realistic for location (0.8-2.5% of value)
- Insurance: realistic ($1,200-$3,000/year for most properties)
${location ? `- ALL properties must be located in or near: ${location}` : '- Include geographic diversity across different US markets'}
- The "strategy_fit" field must explain WHY this property fits the ${targetStrategy.name} strategy
- Return ONLY the JSON array, nothing else`;

    const userPrompt = location
      ? `Find ${count} ${targetStrategy.name} investment properties in ${location}`
      : `Find ${count} diverse ${targetStrategy.name} investment properties across different US markets`;

    const rawResponse = await askPerplexity(systemPrompt, userPrompt);

    let properties;
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      properties = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
    } catch {
      console.error('[ai:suggestions-by-strategy] Failed to parse JSON:', rawResponse.slice(0, 200));
      return res.status(500).json({ error: 'Failed to parse property suggestions' });
    }

    // Enrich with location data (in parallel for performance)
    const enrichedProperties = await Promise.all(
      properties.map(async (prop: any) => {
        try {
          const lat = prop.latitude;
          const lon = prop.longitude;

          // Extract state from address
          const stateMatch = prop.property_address?.match(/,\s*([A-Z]{2})\s+\d{5}/);
          const state = stateMatch?.[1] || '';

          // Fetch location insights in parallel
          const [walkScore, crimeData, floodData] = await Promise.all([
            lat && lon ? (async () => {
              try {
                const ws = await import('../../services/walkscore');
                return await ws.getWalkScore(lat, lon, prop.property_address);
              } catch {
                return { walkScore: null, transitScore: null, bikeScore: null };
              }
            })() : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),

            state ? (async () => {
              try {
                const fbi = await import('../../services/fbi');
                return await fbi.getCrimeStats(state);
              } catch {
                return { violentCrimeRate: null, propertyCrimeRate: null };
              }
            })() : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),

            lat && lon ? (async () => {
              try {
                const fema = await import('../../services/fema');
                return await fema.getFloodZone(lat, lon);
              } catch {
                return { floodZone: null, floodRisk: null };
              }
            })() : Promise.resolve({ floodZone: null, floodRisk: null }),
          ]);

          return {
            ...prop,
            location_insights: {
              walkability: walkScore,
              safety: crimeData,
              flood_risk: floodData,
            },
          };
        } catch (err) {
          console.error('[location-enrichment]', err);
          return prop;
        }
      })
    );

    res.json({
      strategy: targetStrategy,
      properties: enrichedProperties,
      count: enrichedProperties.length,
      location: location || 'nationwide',
    });
  } catch (err) {
    console.error('[ai:suggestions-by-strategy]', err);
    res.status(500).json({ error: 'Failed to generate strategy-based suggestions' });
  }
});

// --- Get All Available Strategies ---

router.get('/strategies', (req, res) => {
  res.json({
    strategies: STRATEGIES.map(s => ({
      name: s.name,
      key: s.key,
      description: s.description,
      targetMetrics: s.targetMetrics,
      locationPreferences: s.locationPreferences,
    })),
  });
});

// --- Analyze Property Strategy Fit ---

router.post('/analyze-strategy', async (req, res) => {
  const {
    property_address,
    purchase_price,
    expected_monthly_rent,
    down_payment_pct,
    interest_rate,
    loan_term_years,
    property_taxes_annual,
    insurance_annual,
    hoa_monthly,
    vacancy_rate_pct,
    monthly_expenses,
    property_type,
    year_built,
    latitude,
    longitude,
    strategy_key: strategyKeyForOverrides,
    targetMetrics: targetMetricsOverride,
    locationPreferences: locationPreferencesOverride,
    weights: weightsOverride,
  } = req.body;

  if (!purchase_price || !expected_monthly_rent) {
    return res.status(400).json({ error: 'Purchase price and expected monthly rent are required' });
  }

  try {
    // Calculate deal metrics
    const metrics = analyzeDeal({
      purchasePrice: purchase_price,
      downPaymentPct: down_payment_pct || 20,
      interestRate: interest_rate || 7.0,
      loanTermYears: loan_term_years || 30,
      expectedMonthlyRent: expected_monthly_rent,
      monthlyExpenses: monthly_expenses || 200,
      propertyTaxesAnnual: property_taxes_annual || 0,
      insuranceAnnual: insurance_annual || 1200,
      hoaMonthly: hoa_monthly || 0,
      vacancyRatePct: vacancy_rate_pct || 5,
    });

    // Fetch location insights if coordinates provided
    let locationInsights;
    if (latitude && longitude) {
      const stateMatch = property_address?.match(/,\s*([A-Z]{2})\s+\d{5}/);
      const state = stateMatch?.[1] || '';

      const [walkScore, crimeData, floodData] = await Promise.all([
        getWalkScore(latitude, longitude, property_address).catch(() => ({ walkScore: null, transitScore: null, bikeScore: null })),
        state ? getCrimeStats(state).catch(() => ({ violentCrimeRate: null, propertyCrimeRate: null })) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
        getFloodZone(latitude, longitude).catch(() => ({ floodZone: null, floodRisk: null })),
      ]);

      locationInsights = {
        walkability: walkScore,
        safety: crimeData,
        flood_risk: floodData,
      };
    }

    // Calculate strategy fit for all strategies. When the caller targets a
    // specific strategy and supplies overrides, those are passed through so
    // that strategy's tier cutoffs reflect the user's customized thresholds.
    const thresholds = strategyKeyForOverrides
      ? buildThresholds(strategyKeyForOverrides, targetMetricsOverride, locationPreferencesOverride)
      : undefined;
    const weightsForMatcher = strategyKeyForOverrides
      ? buildWeights(strategyKeyForOverrides, weightsOverride)
      : undefined;

    const strategyScores = calculateStrategyFit(
      metrics,
      locationInsights,
      property_type,
      year_built,
      thresholds,
      weightsForMatcher,
    );

    const bestStrategy = strategyScores[0];

    res.json({
      property_address: property_address || 'Unspecified',
      metrics,
      location_insights: locationInsights || null,
      best_strategy: bestStrategy.strategy,
      strategy_score: bestStrategy.score,
      all_strategy_scores: strategyScores,
      recommendation: bestStrategy.score >= 70
        ? `Strong fit for ${bestStrategy.strategy} strategy`
        : bestStrategy.score >= 50
        ? `Moderate fit for ${bestStrategy.strategy} strategy`
        : `Weak fit - consider other properties or strategies`,
    });
  } catch (err) {
    console.error('[ai:analyze-strategy]', err);
    res.status(500).json({ error: 'Failed to analyze property strategy' });
  }
});

// --- Neighborhood AI Summary ---

router.post('/neighborhood-summary', async (req, res) => {
  const { location, data } = req.body;
  if (!location) return res.status(400).json({ error: 'location is required' });

  try {
    const systemPrompt = `You are a real estate investment analyst specializing in neighborhood-level market intelligence.
Given structured data about a location, produce a concise but insightful investment summary in markdown.

Structure your response with these sections:
## Investment Appeal
Rate the overall investment attractiveness and explain why in 2-3 sentences.

## Key Strengths
Bullet list of 3-4 strengths backed by the data provided and your knowledge of the area.

## Risk Factors
Bullet list of 2-3 risks or concerns an investor should be aware of.

## Market Outlook
2-3 sentences on where this market is headed — appreciation trajectory, rental demand trends, and any upcoming developments or economic shifts.

Keep it practical and data-driven. Reference specific numbers from the data when available. Do NOT repeat raw data — interpret it.`;

    const demo = data?.demographics || {};
    const housing = data?.housing || {};
    const market = data?.marketTrends || {};
    const walk = data?.walkability || {};
    const safety = data?.safety || {};
    const climate = data?.climate || {};

    const userPrompt = `Analyze this neighborhood for real estate investment potential:

Location: ${location}
Population: ${demo.population ?? 'N/A'} | Median Age: ${demo.medianAge ?? 'N/A'}
Median Household Income: ${demo.medianHouseholdIncome ? `$${demo.medianHouseholdIncome.toLocaleString()}` : 'N/A'}
Education (Bachelor's+): ${demo.educationBachelorsPct != null ? `${demo.educationBachelorsPct.toFixed(1)}%` : 'N/A'}
Poverty Rate: ${demo.povertyRate != null ? `${demo.povertyRate.toFixed(1)}%` : 'N/A'}

Housing: ${housing.totalUnits ?? 'N/A'} units | Vacancy: ${housing.vacancyRate != null ? `${housing.vacancyRate.toFixed(1)}%` : 'N/A'}
Median Home Value: ${housing.medianHomeValue ? `$${housing.medianHomeValue.toLocaleString()}` : 'N/A'}
Median Rent: ${housing.medianRent ? `$${housing.medianRent.toLocaleString()}/mo` : 'N/A'}
Owner-Occupied: ${housing.ownerOccupiedPct != null ? `${housing.ownerOccupiedPct.toFixed(0)}%` : 'N/A'}

Mortgage Rate: ${market.currentMortgageRate != null ? `${market.currentMortgageRate.toFixed(2)}%` : 'N/A'}
Case-Shiller Index: ${market.caseShillerIndex ?? 'N/A'}

Walk Score: ${walk.walkScore ?? 'N/A'} | Transit Score: ${walk.transitScore ?? 'N/A'} | Bike Score: ${walk.bikeScore ?? 'N/A'}
Violent Crime Rate: ${safety.violentCrimeRate != null ? `${safety.violentCrimeRate.toFixed(1)} per 100K` : 'N/A'}
Property Crime Rate: ${safety.propertyCrimeRate != null ? `${safety.propertyCrimeRate.toFixed(1)} per 100K` : 'N/A'}
Flood Zone: ${climate.floodZone || 'N/A'} | Flood Risk: ${climate.floodRisk || 'N/A'}`;

    const summary = await askPerplexity(systemPrompt, userPrompt);
    res.json({ location, summary });
  } catch (err) {
    console.error('[ai:neighborhood-summary]', err);
    res.status(500).json({ error: 'Failed to generate neighborhood summary' });
  }
});

export default router;
