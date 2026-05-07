import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'REALM_SUPABASE_URL',
  'REALM_SUPABASE_SERVICE_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const realmSupabase = createClient(
  process.env.REALM_SUPABASE_URL!,
  process.env.REALM_SUPABASE_SERVICE_KEY!,
);
