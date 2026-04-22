interface FloodZoneResponse {
  floodZone: string | null;
  floodRisk: 'low' | 'moderate' | 'high' | null;
}

export async function getFloodZone(lat: number, lon: number): Promise<FloodZoneResponse> {
  try {
    const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=false&f=json`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[fema] API error:', res.status);
      return { floodZone: null, floodRisk: null };
    }

    const data = await res.json();
    const features = data.features;

    if (!features || features.length === 0) {
      return { floodZone: 'X (Minimal Risk)', floodRisk: 'low' };
    }

    const zone = features[0].attributes.FLD_ZONE || null;

    let floodRisk: 'low' | 'moderate' | 'high' | null = null;
    if (zone) {
      if (['A', 'AE', 'AH', 'AO', 'AR', 'V', 'VE'].includes(zone)) {
        floodRisk = 'high';
      } else if (['B', 'X500', 'AREA NOT INCLUDED'].includes(zone) || zone.includes('SHADED')) {
        floodRisk = 'moderate';
      } else {
        floodRisk = 'low';
      }
    }

    return { floodZone: zone, floodRisk };
  } catch (err) {
    console.error('[fema] fetch error:', err);
    return { floodZone: null, floodRisk: null };
  }
}
