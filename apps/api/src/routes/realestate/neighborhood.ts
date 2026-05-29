import { Router } from 'express';
import { getCensusData } from '../../services/census';
import { getMortgageRate, getCaseShillerIndex, getHousingStarts } from '../../services/fred';
import { getWalkScore } from '../../services/walkscore';
import { getFloodZone } from '../../services/fema';
import { getCrimeStats } from '../../services/fbi';

const router = Router();

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; state: string } | null> {
  // Try Census geocoder first (works best with full addresses)
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(location)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const match = data.result?.addressMatches?.[0];
      if (match) {
        return {
          lat: parseFloat(match.coordinates.y),
          lon: parseFloat(match.coordinates.x),
          state: match.addressComponents?.state || '',
        };
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  // Fallback to Nominatim (handles zip codes and city names)
  try {
    const isZip = /^\d{5}$/.test(location.trim());
    const params = isZip
      ? `postalcode=${location.trim()}&country=US`
      : `q=${encodeURIComponent(location.trim())}&countrycodes=US`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}&format=json&addressdetails=1&limit=1`,
      { headers: { 'User-Agent': 'RealmApp/1.0' } },
    );
    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        const addr = results[0].address || {};
        const state = addr['ISO3166-2-lvl4']?.replace('US-', '') || addr.state || '';
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
          state,
        };
      }
    }
  } catch {
    // Give up
  }

  return { lat: 0, lon: 0, state: '' };
}

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

interface LocationDataGaps {
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  violentCrimeRate: number | null;
  propertyCrimeRate: number | null;
  floodZone: string | null;
  floodRisk: 'low' | 'moderate' | 'high' | null;
  currentMortgageRate: number | null;
  caseShillerIndex: number | null;
}

async function askPerplexityJSON(apiKey: string, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

const EMPTY_GAPS: LocationDataGaps = { walkScore: null, transitScore: null, bikeScore: null, violentCrimeRate: null, propertyCrimeRate: null, floodZone: null, floodRisk: null, currentMortgageRate: null, caseShillerIndex: null };

async function fillDataGapsWithAI(
  location: string,
  needs: { walk: boolean; safety: boolean; flood: boolean; market: boolean },
): Promise<LocationDataGaps> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return EMPTY_GAPS;

  const calls: Promise<Record<string, unknown> | null>[] = [];
  const callKeys: string[] = [];

  if (needs.walk) {
    callKeys.push('walk');
    calls.push(askPerplexityJSON(apiKey,
      `You are a data lookup tool. Return ONLY valid JSON, no markdown, no explanation.
Format: {"walkScore":number,"transitScore":number,"bikeScore":number}
All scores 0-100. Look up the official Walk Score, Transit Score, and Bike Score from walkscore.com for this location. You MUST provide numeric values — do not return null.`,
      `What are the Walk Score, Transit Score, and Bike Score for ${location}? Search walkscore.com for this ZIP code or city.`,
    ));
  }

  if (needs.safety) {
    callKeys.push('safety');
    calls.push(askPerplexityJSON(apiKey,
      `You are a data lookup tool. Return ONLY valid JSON, no markdown, no explanation.
Format: {"violentCrimeRate":number,"propertyCrimeRate":number}
Rates are per 100,000 residents. Use the most recent annual FBI UCR data or city/county crime statistics. You MUST provide numeric values — do not return null. If exact local data isn't available, use the state-level FBI rate.`,
      `What are the violent crime rate and property crime rate per 100,000 residents for ${location}? Search for FBI UCR crime data or local police department statistics.`,
    ));
  }

  if (needs.flood) {
    callKeys.push('flood');
    calls.push(askPerplexityJSON(apiKey,
      `You are a data lookup tool. Return ONLY valid JSON, no markdown, no explanation.
Format: {"floodZone":string,"floodRisk":"low"|"moderate"|"high"}
floodZone: the FEMA flood zone designation (e.g. "X", "AE", "A", "X (Minimal Risk)").
floodRisk: "low", "moderate", or "high" based on the zone. Zone X = low, Zone B/X500 = moderate, Zones A/AE/V/VE = high.
You MUST provide values — do not return null.`,
      `What is the FEMA flood zone designation and flood risk level for ${location}? Search for FEMA flood map data.`,
    ));
  }

  if (needs.market) {
    callKeys.push('market');
    calls.push(askPerplexityJSON(apiKey,
      `You are a data lookup tool. Return ONLY valid JSON, no markdown, no explanation.
Format: {"currentMortgageRate":number,"caseShillerIndex":number}
currentMortgageRate: the current US average 30-year fixed mortgage rate as a percentage (e.g. 6.87).
caseShillerIndex: the latest S&P/Case-Shiller U.S. National Home Price Index value (e.g. 329.5).
You MUST provide numeric values — do not return null.`,
      `What is the current 30-year fixed mortgage rate and the latest S&P Case-Shiller National Home Price Index value?`,
    ));
  }

  try {
    const results = await Promise.all(calls);
    const merged = { ...EMPTY_GAPS };

    for (let i = 0; i < callKeys.length; i++) {
      const parsed = results[i];
      if (!parsed) continue;

      if (callKeys[i] === 'walk') {
        if (typeof parsed.walkScore === 'number') merged.walkScore = parsed.walkScore;
        if (typeof parsed.transitScore === 'number') merged.transitScore = parsed.transitScore;
        if (typeof parsed.bikeScore === 'number') merged.bikeScore = parsed.bikeScore;
      } else if (callKeys[i] === 'safety') {
        if (typeof parsed.violentCrimeRate === 'number') merged.violentCrimeRate = parsed.violentCrimeRate;
        if (typeof parsed.propertyCrimeRate === 'number') merged.propertyCrimeRate = parsed.propertyCrimeRate;
      } else if (callKeys[i] === 'flood') {
        if (typeof parsed.floodZone === 'string') merged.floodZone = parsed.floodZone;
        if (['low', 'moderate', 'high'].includes(parsed.floodRisk as string)) merged.floodRisk = parsed.floodRisk as 'low' | 'moderate' | 'high';
      } else if (callKeys[i] === 'market') {
        if (typeof parsed.currentMortgageRate === 'number') merged.currentMortgageRate = parsed.currentMortgageRate;
        if (typeof parsed.caseShillerIndex === 'number') merged.caseShillerIndex = parsed.caseShillerIndex;
      }
    }

    return merged;
  } catch (err) {
    console.error('[neighborhood:ai-fallback]', err);
    return EMPTY_GAPS;
  }
}

async function reverseGeocodeState(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=5`,
      { headers: { 'User-Agent': 'RealmApp/1.0' } },
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      return addr['ISO3166-2-lvl4']?.replace('US-', '') || '';
    }
  } catch {}
  return '';
}

router.get('/', async (req, res) => {
  const location = req.query.location as string;
  const locationType = (req.query.type as string) || 'zip';

  if (!location) {
    return res.status(400).json({ error: 'Location parameter is required' });
  }

  try {
    const geo = await geocodeLocation(location);
    let lat = geo?.lat || 0;
    let lon = geo?.lon || 0;
    let state = geo?.state || '';

    if (lat && lon && !state) {
      state = await reverseGeocodeState(lat, lon);
    }

    let [census, mortgageRate, caseShiller, housingStarts, walkScore, floodData, crimeData] =
      await Promise.all([
        getCensusData(locationType === 'zip' ? location : ''),
        getMortgageRate(),
        getCaseShillerIndex(),
        getHousingStarts(),
        lat && lon ? getWalkScore(lat, lon, location) : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),
        lat && lon ? getFloodZone(lat, lon) : Promise.resolve({ floodZone: null, floodRisk: null }),
        state ? getCrimeStats(state) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
      ]);

    const hasWalkGaps = walkScore.walkScore === null && walkScore.transitScore === null && walkScore.bikeScore === null;
    const hasSafetyGaps = crimeData.violentCrimeRate === null && crimeData.propertyCrimeRate === null;
    const hasFloodGaps = floodData.floodZone === null && floodData.floodRisk === null;
    const hasMarketGaps = mortgageRate === null && caseShiller === null;

    if (hasWalkGaps || hasSafetyGaps || hasFloodGaps || hasMarketGaps) {
      const aiData = await fillDataGapsWithAI(location, { walk: hasWalkGaps, safety: hasSafetyGaps, flood: hasFloodGaps, market: hasMarketGaps });
      if (hasWalkGaps) {
        walkScore = { walkScore: aiData.walkScore, transitScore: aiData.transitScore, bikeScore: aiData.bikeScore };
      }
      if (hasSafetyGaps) {
        crimeData = { violentCrimeRate: aiData.violentCrimeRate, propertyCrimeRate: aiData.propertyCrimeRate };
      }
      if (hasFloodGaps) {
        floodData = { floodZone: aiData.floodZone, floodRisk: aiData.floodRisk };
      }
      if (hasMarketGaps) {
        if (mortgageRate === null) mortgageRate = aiData.currentMortgageRate;
        if (caseShiller === null) caseShiller = aiData.caseShillerIndex;
      }
    }

    res.json({
      location,
      locationType,
      geo: { lat, lon },
      demographics: {
        population: census.population,
        medianAge: census.medianAge,
        medianHouseholdIncome: census.medianHouseholdIncome,
        povertyRate: census.povertyRate,
        educationBachelorsPct: census.educationBachelorsPct,
      },
      housing: {
        totalUnits: census.totalUnits,
        vacancyRate: census.vacancyRate,
        medianHomeValue: census.medianHomeValue,
        medianRent: census.medianRent,
        ownerOccupiedPct: census.ownerOccupiedPct,
      },
      marketTrends: {
        currentMortgageRate: mortgageRate,
        caseShillerIndex: caseShiller,
        housingStarts,
      },
      walkability: walkScore,
      safety: crimeData,
      climate: floodData,
    });
  } catch (err) {
    console.error('[neighborhood:get]', err);
    res.status(500).json({ error: 'Failed to fetch neighborhood data' });
  }
});

router.get('/compare', async (req, res) => {
  const locationsParam = req.query.locations as string;
  if (!locationsParam) {
    return res.status(400).json({ error: 'Locations parameter is required' });
  }

  const locations = locationsParam.split(',').map((l) => l.trim()).slice(0, 3);

  try {
    const results = await Promise.all(
      locations.map(async (location) => {
        const locationType = /^\d{5}$/.test(location) ? 'zip' : 'city';
        const geo = await geocodeLocation(location);
        const lat = geo?.lat || 0;
        const lon = geo?.lon || 0;
        let state = geo?.state || '';

        if (lat && lon && !state) {
          state = await reverseGeocodeState(lat, lon);
        }

        let [census, mortgageRate, caseShiller, housingStarts, walkScore, floodData, crimeData] =
          await Promise.all([
            getCensusData(locationType === 'zip' ? location : ''),
            getMortgageRate(),
            getCaseShillerIndex(),
            getHousingStarts(),
            lat && lon ? getWalkScore(lat, lon, location) : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),
            lat && lon ? getFloodZone(lat, lon) : Promise.resolve({ floodZone: null, floodRisk: null }),
            state ? getCrimeStats(state) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
          ]);

        const hasWalkGaps = walkScore.walkScore === null && walkScore.transitScore === null && walkScore.bikeScore === null;
        const hasSafetyGaps = crimeData.violentCrimeRate === null && crimeData.propertyCrimeRate === null;
        const hasFloodGaps = floodData.floodZone === null && floodData.floodRisk === null;
        const hasMarketGaps = mortgageRate === null && caseShiller === null;

        if (hasWalkGaps || hasSafetyGaps || hasFloodGaps || hasMarketGaps) {
          const aiData = await fillDataGapsWithAI(location, { walk: hasWalkGaps, safety: hasSafetyGaps, flood: hasFloodGaps, market: hasMarketGaps });
          if (hasWalkGaps) {
            walkScore = { walkScore: aiData.walkScore, transitScore: aiData.transitScore, bikeScore: aiData.bikeScore };
          }
          if (hasSafetyGaps) {
            crimeData = { violentCrimeRate: aiData.violentCrimeRate, propertyCrimeRate: aiData.propertyCrimeRate };
          }
          if (hasFloodGaps) {
            floodData = { floodZone: aiData.floodZone, floodRisk: aiData.floodRisk };
          }
          if (hasMarketGaps) {
            if (mortgageRate === null) mortgageRate = aiData.currentMortgageRate;
            if (caseShiller === null) caseShiller = aiData.caseShillerIndex;
          }
        }

        return {
          location,
          locationType,
          geo: { lat, lon },
          demographics: {
            population: census.population, medianAge: census.medianAge,
            medianHouseholdIncome: census.medianHouseholdIncome,
            povertyRate: census.povertyRate, educationBachelorsPct: census.educationBachelorsPct,
          },
          housing: {
            totalUnits: census.totalUnits, vacancyRate: census.vacancyRate,
            medianHomeValue: census.medianHomeValue, medianRent: census.medianRent,
            ownerOccupiedPct: census.ownerOccupiedPct,
          },
          marketTrends: { currentMortgageRate: mortgageRate, caseShillerIndex: caseShiller, housingStarts },
          walkability: walkScore,
          safety: crimeData,
          climate: floodData,
        };
      }),
    );

    res.json(results);
  } catch (err) {
    console.error('[neighborhood:compare]', err);
    res.status(500).json({ error: 'Failed to compare neighborhoods' });
  }
});

export default router;
