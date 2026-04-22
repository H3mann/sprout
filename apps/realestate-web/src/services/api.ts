import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired. Please sign in again.');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// --- Neighborhood ---

export interface NeighborhoodData {
  location: string;
  locationType: string;
  geo: { lat: number; lon: number };
  demographics: {
    population: number | null;
    medianAge: number | null;
    medianHouseholdIncome: number | null;
    povertyRate: number | null;
    educationBachelorsPct: number | null;
  };
  housing: {
    totalUnits: number | null;
    vacancyRate: number | null;
    medianHomeValue: number | null;
    medianRent: number | null;
    ownerOccupiedPct: number | null;
  };
  marketTrends: {
    currentMortgageRate: number | null;
    caseShillerIndex: number | null;
    housingStarts: number | null;
  };
  walkability: {
    walkScore: number | null;
    transitScore: number | null;
    bikeScore: number | null;
  };
  safety: {
    violentCrimeRate: number | null;
    propertyCrimeRate: number | null;
  };
  climate: {
    floodZone: string | null;
    floodRisk: 'low' | 'moderate' | 'high' | null;
  };
}

export interface ZillowHomeValue {
  region_name: string;
  region_type: string;
  state: string | null;
  date: string;
  zhvi: number | null;
}

export interface ZillowRentIndex {
  region_name: string;
  region_type: string;
  state: string | null;
  date: string;
  zori: number | null;
}

export const neighborhoodApi = {
  get: (location: string, type: string) =>
    request<NeighborhoodData>(`/realestate/neighborhood?location=${encodeURIComponent(location)}&type=${encodeURIComponent(type)}`),
  compare: (locations: string[]) =>
    request<NeighborhoodData[]>(`/realestate/neighborhood/compare?locations=${encodeURIComponent(locations.join(','))}`),
};

export const zillowApi = {
  homeValues: (region: string, type: string) =>
    request<ZillowHomeValue[]>(`/realestate/zillow/home-values?region=${encodeURIComponent(region)}&type=${encodeURIComponent(type)}`),
  rentIndex: (region: string, type: string) =>
    request<ZillowRentIndex[]>(`/realestate/zillow/rent-index?region=${encodeURIComponent(region)}&type=${encodeURIComponent(type)}`),
};

// --- Deal Analyzer ---

export interface DealAnalysisInput {
  property_address: string;
  purchase_price: number;
  down_payment_pct: number;
  interest_rate: number;
  loan_term_years: number;
  expected_monthly_rent: number;
  monthly_expenses: number;
  property_taxes_annual: number;
  insurance_annual: number;
  hoa_monthly: number;
  vacancy_rate_pct: number;
}

export interface DealMetrics {
  monthlyMortgage: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  grossRentMultiplier: number;
  totalCashNeeded: number;
  noi: number;
  appreciation: {
    year5: { value: number; equity: number };
    year10: { value: number; equity: number };
    year30: { value: number; equity: number };
  };
  investmentScore: number;
}

export interface ApiDealAnalysis {
  id: string;
  user_id: string;
  property_address: string;
  purchase_price: number;
  down_payment_pct: number;
  interest_rate: number;
  loan_term_years: number;
  expected_monthly_rent: number;
  monthly_expenses: number;
  property_taxes_annual: number;
  insurance_annual: number;
  hoa_monthly: number;
  vacancy_rate_pct: number;
  computed_metrics: DealMetrics | null;
  location_zip: string | null;
  location_state: string | null;
  ai_summary: string | null;
  perplexity_property_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const dealApi = {
  analyze: (input: DealAnalysisInput) =>
    request<{ metrics: DealMetrics; aiSummary: string; propertyData: Record<string, unknown> }>(
      '/realestate/deal/analyze',
      { method: 'POST', body: JSON.stringify(input) }
    ),
  list: () => request<ApiDealAnalysis[]>('/realestate/deal'),
  get: (id: string) => request<ApiDealAnalysis>(`/realestate/deal/${id}`),
  save: (analysis: Omit<ApiDealAnalysis, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    request<ApiDealAnalysis>('/realestate/deal/save', { method: 'POST', body: JSON.stringify(analysis) }),
  remove: (id: string) => request<void>(`/realestate/deal/${id}`, { method: 'DELETE' }),
};

// --- Saved Searches ---

export interface ApiSavedSearch {
  id: string;
  user_id: string;
  label: string;
  location_type: string;
  location_value: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export const savedSearchApi = {
  list: () => request<ApiSavedSearch[]>('/realestate/saved-searches'),
  create: (search: { label: string; location_type: string; location_value: string; state?: string; latitude?: number; longitude?: number }) =>
    request<ApiSavedSearch>('/realestate/saved-searches', { method: 'POST', body: JSON.stringify(search) }),
  remove: (id: string) => request<void>(`/realestate/saved-searches/${id}`, { method: 'DELETE' }),
};

// --- AI ---

export interface AIResponse {
  response: string;
}

export interface PropertySuggestion {
  property_address: string;
  purchase_price: number;
  expected_monthly_rent: number;
  property_taxes_annual: number;
  insurance_annual: number;
  hoa_monthly: number;
  interest_rate: number;
  down_payment_pct: number;
  loan_term_years: number;
  vacancy_rate_pct: number;
  monthly_expenses: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  year_built: number;
  why: string;
  image_url: string;
  zillow_url: string;
  realtor_url: string;
  latitude: number;
  longitude: number;
  // Strategy-based enrichment (optional fields from enhanced endpoints)
  metrics?: DealMetrics;
  location_insights?: LocationInsights;
  best_strategy?: string;
  strategy_score?: number;
  all_strategy_scores?: StrategyScore[];
  strategy_fit?: string;
  estimated_rehab_cost?: number;
}

export interface ScoreContribution {
  factor: string;
  value: string;
  points: number;
  explanation: string;
}

export interface StrategyScore {
  strategy: string;
  score: number;
  reason: string;
  baseline: number;
  contributions: ScoreContribution[];
}

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
}

export interface InvestmentStrategy {
  name: string;
  key: string;
  description: string;
  targetMetrics: Record<string, unknown>;
  locationPreferences: Record<string, unknown>;
}

export const aiApi = {
  discover: (query: string) =>
    request<AIResponse & { query: string }>('/realestate/ai/discover', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  screen: (criteria: string) =>
    request<AIResponse & { criteria: string }>('/realestate/ai/screen', {
      method: 'POST',
      body: JSON.stringify({ criteria }),
    }),
  thesis: (propertyAddress: string, metrics: DealMetrics, inputs: Record<string, unknown>) =>
    request<AIResponse & { propertyAddress: string }>('/realestate/ai/thesis', {
      method: 'POST',
      body: JSON.stringify({ propertyAddress, metrics, inputs }),
    }),
  suggestions: (criteria?: string) =>
    request<{
      properties: PropertySuggestion[];
      grouped_by_strategy?: Record<string, PropertySuggestion[]>;
      criteria: string | null;
    }>('/realestate/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify({ criteria }),
    }),
  strategies: () =>
    request<{ strategies: InvestmentStrategy[] }>('/realestate/ai/strategies'),
  suggestionsByStrategy: (
    strategy: string,
    location?: string,
    count?: number,
    overrides?: {
      targetMetrics?: Record<string, unknown>;
      locationPreferences?: Record<string, unknown>;
    },
  ) =>
    request<{
      strategy: InvestmentStrategy;
      properties: PropertySuggestion[];
      count: number;
      location: string;
    }>('/realestate/ai/suggestions-by-strategy', {
      method: 'POST',
      body: JSON.stringify({
        strategy,
        location,
        count,
        targetMetrics: overrides?.targetMetrics,
        locationPreferences: overrides?.locationPreferences,
      }),
    }),
  analyzeStrategy: (input: Partial<DealAnalysisInput> & {
    property_type?: string;
    year_built?: number;
    latitude?: number;
    longitude?: number;
    strategy_key?: string;
    targetMetrics?: Record<string, unknown>;
    locationPreferences?: Record<string, unknown>;
    weights?: Record<string, number>;
  }) =>
    request<{
      property_address: string;
      metrics: DealMetrics;
      location_insights: LocationInsights | null;
      best_strategy: string;
      strategy_score: number;
      all_strategy_scores: StrategyScore[];
      recommendation: string;
    }>('/realestate/ai/analyze-strategy', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
