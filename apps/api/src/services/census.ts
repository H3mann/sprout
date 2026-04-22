const CENSUS_BASE = 'https://api.census.gov/data';

interface CensusResponse {
  population: number | null;
  medianAge: number | null;
  medianHouseholdIncome: number | null;
  povertyRate: number | null;
  educationBachelorsPct: number | null;
  totalUnits: number | null;
  vacancyRate: number | null;
  medianHomeValue: number | null;
  medianRent: number | null;
  ownerOccupiedPct: number | null;
  medianPropertyTax: number | null;
}

export async function getCensusData(zip: string): Promise<CensusResponse> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    console.warn('[census] No CENSUS_API_KEY set — returning nulls');
    return nullResponse();
  }

  try {
    const variables = [
      'B01003_001E', // total population
      'B01002_001E', // median age
      'B19013_001E', // median household income
      'B17001_002E', // poverty count
      'B15003_022E', // bachelor's degree
      'B15003_001E', // total education population
      'B25001_001E', // total housing units
      'B25002_003E', // vacant housing units
      'B25077_001E', // median home value
      'B25064_001E', // median gross rent
      'B25003_002E', // owner-occupied units
      'B25003_001E', // total occupied units
      'B25090_001E', // median real estate taxes (all owner-occupied)
    ].join(',');

    const url = `${CENSUS_BASE}/2022/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zip}&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[census] API error:', res.status);
      return nullResponse();
    }

    const data = await res.json();
    if (!data || data.length < 2) return nullResponse();

    const row = data[1];
    const population = parseFloat(row[0]) || null;
    const medianAge = parseFloat(row[1]) || null;
    const medianHouseholdIncome = parseFloat(row[2]) || null;
    const povertyCount = parseFloat(row[3]) || 0;
    const bachelorCount = parseFloat(row[4]) || 0;
    const educationTotal = parseFloat(row[5]) || 0;
    const totalUnits = parseFloat(row[6]) || null;
    const vacantUnits = parseFloat(row[7]) || 0;
    const medianHomeValue = parseFloat(row[8]) || null;
    const medianRent = parseFloat(row[9]) || null;
    const ownerOccupied = parseFloat(row[10]) || 0;
    const totalOccupied = parseFloat(row[11]) || 0;
    const medianPropertyTax = parseFloat(row[12]) || null;

    return {
      population,
      medianAge,
      medianHouseholdIncome,
      povertyRate: population ? (povertyCount / population) * 100 : null,
      educationBachelorsPct: educationTotal ? (bachelorCount / educationTotal) * 100 : null,
      totalUnits,
      vacancyRate: totalUnits ? (vacantUnits / totalUnits) * 100 : null,
      medianHomeValue,
      medianRent,
      ownerOccupiedPct: totalOccupied ? (ownerOccupied / totalOccupied) * 100 : null,
      medianPropertyTax,
    };
  } catch (err) {
    console.error('[census] fetch error:', err);
    return nullResponse();
  }
}

function nullResponse(): CensusResponse {
  return {
    population: null, medianAge: null, medianHouseholdIncome: null,
    povertyRate: null, educationBachelorsPct: null, totalUnits: null,
    vacancyRate: null, medianHomeValue: null, medianRent: null, ownerOccupiedPct: null,
    medianPropertyTax: null,
  };
}
