-- Real Estate Analysis Tables
-- Run this in your Supabase SQL Editor

-- Zillow Home Value Index (ingested from CSV)
CREATE TABLE IF NOT EXISTS zillow_home_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  region_type TEXT NOT NULL,
  state TEXT,
  date DATE NOT NULL,
  zhvi NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region_name, region_type, date)
);
CREATE INDEX IF NOT EXISTS idx_zhv_region ON zillow_home_values(region_name, region_type);
CREATE INDEX IF NOT EXISTS idx_zhv_date ON zillow_home_values(date);

-- Zillow Observed Rent Index (ingested from CSV)
CREATE TABLE IF NOT EXISTS zillow_rent_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  region_type TEXT NOT NULL,
  state TEXT,
  date DATE NOT NULL,
  zori NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region_name, region_type, date)
);
CREATE INDEX IF NOT EXISTS idx_zri_region ON zillow_rent_index(region_name, region_type);
CREATE INDEX IF NOT EXISTS idx_zri_date ON zillow_rent_index(date);

-- User's saved neighborhood searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  location_type TEXT NOT NULL,
  location_value TEXT NOT NULL,
  state TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ss_user ON saved_searches(user_id);

-- User's saved deal analyses
CREATE TABLE IF NOT EXISTS deal_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  down_payment_pct NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_term_years INTEGER NOT NULL DEFAULT 30,
  expected_monthly_rent NUMERIC,
  monthly_expenses NUMERIC,
  property_taxes_annual NUMERIC,
  insurance_annual NUMERIC,
  hoa_monthly NUMERIC DEFAULT 0,
  vacancy_rate_pct NUMERIC DEFAULT 5,
  computed_metrics JSONB,
  location_zip TEXT,
  location_state TEXT,
  ai_summary TEXT,
  perplexity_property_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_da_user ON deal_analyses(user_id);

-- Row Level Security

ALTER TABLE zillow_home_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read zillow_home_values" ON zillow_home_values
  FOR SELECT TO authenticated USING (true);

ALTER TABLE zillow_rent_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read zillow_rent_index" ON zillow_rent_index
  FOR SELECT TO authenticated USING (true);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved_searches" ON saved_searches
  FOR ALL TO authenticated USING (auth.uid() = user_id);

ALTER TABLE deal_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deal_analyses" ON deal_analyses
  FOR ALL TO authenticated USING (auth.uid() = user_id);
