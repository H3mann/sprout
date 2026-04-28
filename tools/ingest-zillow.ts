/**
 * Zillow CSV Ingestion Script
 *
 * Downloads Zillow ZHVI and ZORI CSV data and inserts it into Supabase.
 *
 * Usage:
 *   npx tsx tools/ingest-zillow.ts
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_KEY in apps/api/.env
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in apps/api/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ZHVI_URL = 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const ZORI_URL = 'https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv';

const BATCH_SIZE = 500;

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || '';
    }
    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function downloadAndParse(url: string, table: 'zillow_home_values' | 'zillow_rent_index', valueColumn: 'zhvi' | 'zori') {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)}MB. Parsing...`);

  const records = parseCSV(text);
  console.log(`Parsed ${records.length} regions. Extracting date columns...`);

  const dateColumns = Object.keys(records[0] || {}).filter((col) => /^\d{4}-\d{2}-\d{2}$/.test(col));
  console.log(`Found ${dateColumns.length} date columns (${dateColumns[0]} to ${dateColumns[dateColumns.length - 1]})`);

  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const recentDateColumns = dateColumns.filter((d) => new Date(d) >= fiveYearsAgo);
  console.log(`Ingesting ${recentDateColumns.length} date columns (last 5 years)`);

  let totalRows = 0;
  let batch: Array<Record<string, unknown>> = [];

  for (const record of records) {
    const regionName = record['RegionName'] || '';
    const state = record['StateName'] || record['State'] || '';

    if (!regionName) continue;

    for (const date of recentDateColumns) {
      const value = parseFloat(record[date]);
      if (isNaN(value)) continue;

      batch.push({
        region_name: regionName.toString(),
        region_type: 'zip',
        state,
        date,
        [valueColumn]: value,
      });

      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase.from(table).upsert(batch, {
          onConflict: 'region_name,region_type,date',
          ignoreDuplicates: false,
        });

        if (error) {
          console.error(`Error inserting batch: ${error.message}`);
        } else {
          totalRows += batch.length;
          process.stdout.write(`\r  Inserted ${totalRows} rows...`);
        }

        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase.from(table).upsert(batch, {
      onConflict: 'region_name,region_type,date',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Error inserting final batch: ${error.message}`);
    } else {
      totalRows += batch.length;
    }
  }

  console.log(`\n  Done! Inserted ${totalRows} rows into ${table}`);
}

async function main() {
  console.log('=== Zillow Data Ingestion ===\n');

  console.log('1. Ingesting ZHVI (Home Values)...');
  await downloadAndParse(ZHVI_URL, 'zillow_home_values', 'zhvi');

  console.log('\n2. Ingesting ZORI (Rent Index)...');
  await downloadAndParse(ZORI_URL, 'zillow_rent_index', 'zori');

  console.log('\n=== Ingestion Complete ===');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
