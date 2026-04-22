interface CrimeResponse {
  violentCrimeRate: number | null;
  propertyCrimeRate: number | null;
}

const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09',
  DE: '10', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18',
  IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25',
  MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32',
  NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
  OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47',
  TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55',
  WY: '56', DC: '11',
};

export async function getCrimeStats(stateAbbr: string): Promise<CrimeResponse> {
  try {
    const fips = STATE_ABBR_TO_FIPS[stateAbbr.toUpperCase()];
    if (!fips) {
      return { violentCrimeRate: null, propertyCrimeRate: null };
    }

    const url = `https://api.usa.gov/crime/fbi/sapi/api/estimates/states/${fips}?API_KEY=${process.env.FBI_API_KEY || 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv'}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[fbi] API error:', res.status);
      return { violentCrimeRate: null, propertyCrimeRate: null };
    }

    const data = await res.json();
    const results = data.results;

    if (!results || results.length === 0) {
      return { violentCrimeRate: null, propertyCrimeRate: null };
    }

    const latest = results[results.length - 1];
    const population = latest.population || 1;

    const violentCrime = (latest.violent_crime || 0);
    const propertyCrime = (latest.property_crime || 0);

    return {
      violentCrimeRate: (violentCrime / population) * 100000,
      propertyCrimeRate: (propertyCrime / population) * 100000,
    };
  } catch (err) {
    console.error('[fbi] fetch error:', err);
    return { violentCrimeRate: null, propertyCrimeRate: null };
  }
}
