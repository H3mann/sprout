x-- Sprout Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- Children table
CREATE TABLE children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  photo_url TEXT,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Growth entries table
CREATE TABLE growth_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  head_circumference_cm NUMERIC(5,2),
  recorded_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Visit prep items table
CREATE TABLE visit_prep_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('research', 'faq', 'manual')),
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for faster lookups
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_growth_entries_child_id ON growth_entries(child_id);
CREATE INDEX idx_visit_prep_items_child_id ON visit_prep_items(child_id);

-- Milestone completions table
CREATE TABLE milestone_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, milestone_id)
);

CREATE INDEX idx_milestone_completions_child_id ON milestone_completions(child_id);

-- Vaccine records table
CREATE TABLE vaccine_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  vaccine_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'due', 'upcoming', 'overdue')),
  date_administered DATE,
  provider TEXT,
  lot_number TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, vaccine_id)
);

CREATE INDEX idx_vaccine_records_child_id ON vaccine_records(child_id);

-- Auto-update updated_at on children
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
