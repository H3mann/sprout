import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const realmSupabase = createClient(
  process.env.REALM_SUPABASE_URL!,
  process.env.REALM_SUPABASE_SERVICE_KEY!,
);
