const FRED_BASE = 'https://api.stlouisfed.org/fred';

async function getLatestObservation(seriesId: string): Promise<number | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('[fred] No FRED_API_KEY set');
    return null;
  }

  try {
    const url = `${FRED_BASE}/series/observations?series_id=${seriesId}&sort_order=desc&limit=1&api_key=${apiKey}&file_type=json`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[fred] API error for ${seriesId}:`, res.status);
      return null;
    }

    const data = await res.json();
    const observations = data.observations;
    if (!observations || observations.length === 0) return null;

    const value = parseFloat(observations[0].value);
    return isNaN(value) ? null : value;
  } catch (err) {
    console.error(`[fred] fetch error for ${seriesId}:`, err);
    return null;
  }
}

export async function getMortgageRate(): Promise<number | null> {
  return getLatestObservation('MORTGAGE30US');
}

export async function getCaseShillerIndex(): Promise<number | null> {
  return getLatestObservation('CSUSHPINSA');
}

export async function getHousingStarts(): Promise<number | null> {
  return getLatestObservation('HOUST');
}
