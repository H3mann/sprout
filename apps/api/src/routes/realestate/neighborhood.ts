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
      `https://nominatim.openstreetmap.org/search?${params}&format=json&limit=1`,
      { headers: { 'User-Agent': 'RealmApp/1.0' } },
    );
    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        const stateMatch = results[0].display_name?.match(/,\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),\s*United States/);
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
          state: stateMatch?.[1] || '',
        };
      }
    }
  } catch {
    // Give up
  }

  return { lat: 0, lon: 0, state: '' };
}

router.get('/', async (req, res) => {
  const location = req.query.location as string;
  const locationType = (req.query.type as string) || 'zip';

  if (!location) {
    return res.status(400).json({ error: 'Location parameter is required' });
  }

  try {
    const geo = await geocodeLocation(location);
    const lat = geo?.lat || 0;
    const lon = geo?.lon || 0;
    const state = geo?.state || '';

    const [census, mortgageRate, caseShiller, housingStarts, walkScore, floodData, crimeData] =
      await Promise.all([
        getCensusData(locationType === 'zip' ? location : ''),
        getMortgageRate(),
        getCaseShillerIndex(),
        getHousingStarts(),
        lat && lon ? getWalkScore(lat, lon, location) : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),
        lat && lon ? getFloodZone(lat, lon) : Promise.resolve({ floodZone: null, floodRisk: null }),
        state ? getCrimeStats(state) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
      ]);

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
        const state = geo?.state || '';

        const [census, mortgageRate, caseShiller, housingStarts, walkScore, floodData, crimeData] =
          await Promise.all([
            getCensusData(locationType === 'zip' ? location : ''),
            getMortgageRate(),
            getCaseShillerIndex(),
            getHousingStarts(),
            lat && lon ? getWalkScore(lat, lon, location) : Promise.resolve({ walkScore: null, transitScore: null, bikeScore: null }),
            lat && lon ? getFloodZone(lat, lon) : Promise.resolve({ floodZone: null, floodRisk: null }),
            state ? getCrimeStats(state) : Promise.resolve({ violentCrimeRate: null, propertyCrimeRate: null }),
          ]);

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
