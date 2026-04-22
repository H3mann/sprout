interface WalkScoreResponse {
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS = 1609; // 1 mile in meters

interface OverpassElement {
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function getCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) return { lat: el.lat, lon: el.lon };
  if (el.center) return el.center;
  return null;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decayScore(distance: number): number {
  if (distance <= 400) return 1.0;
  if (distance >= SEARCH_RADIUS) return 0;
  return 1 - (distance - 400) / (SEARCH_RADIUS - 400);
}

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  const res = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();
  return data.elements || [];
}

const WALK_CATEGORIES: Record<string, (tags: Record<string, string>) => boolean> = {
  grocery: (t) => ['supermarket', 'convenience', 'grocery'].includes(t.shop),
  restaurant: (t) => t.amenity === 'restaurant',
  cafe: (t) => t.amenity === 'cafe',
  shopping: (t) => ['clothes', 'department_store', 'mall', 'general'].includes(t.shop),
  school: (t) => t.amenity === 'school',
  park: (t) => t.leisure === 'park',
  culture: (t) => t.amenity === 'library' || t.shop === 'books',
  entertainment: (t) => t.amenity === 'cinema' || t.amenity === 'theatre',
  bank: (t) => t.amenity === 'bank',
  pharmacy: (t) => t.amenity === 'pharmacy',
  fitness: (t) => t.leisure === 'fitness_centre',
  healthcare: (t) => ['doctors', 'clinic', 'hospital'].includes(t.amenity),
};

function computeWalkScore(elements: OverpassElement[], lat: number, lon: number): number {
  const categoryScores: number[] = [];

  for (const [, matcher] of Object.entries(WALK_CATEGORIES)) {
    let bestScore = 0;
    for (const el of elements) {
      const coords = getCoords(el);
      if (!coords || !el.tags || !matcher(el.tags)) continue;
      const dist = haversine(lat, lon, coords.lat, coords.lon);
      const score = decayScore(dist);
      if (score > bestScore) bestScore = score;
    }
    categoryScores.push(bestScore);
  }

  if (categoryScores.length === 0) return 0;
  const avg = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
  return Math.round(avg * 100);
}

function computeTransitScore(elements: OverpassElement[], lat: number, lon: number): number {
  let totalScore = 0;
  const seen = new Set<string>();

  for (const el of elements) {
    const coords = getCoords(el);
    if (!coords) continue;

    const key = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dist = haversine(lat, lon, coords.lat, coords.lon);
    const decay = decayScore(dist);

    const tags = el.tags || {};
    let weight = 1;
    if (tags.railway === 'station' || tags.railway === 'halt') weight = 3;
    if (tags.railway === 'tram_stop') weight = 2;
    if (tags.public_transport === 'station') weight = 3;

    totalScore += decay * weight;
  }

  return Math.min(100, Math.round((totalScore / 15) * 100));
}

function computeBikeScore(elements: OverpassElement[], lat: number, lon: number): number {
  let totalScore = 0;
  const seen = new Set<string>();

  for (const el of elements) {
    const coords = getCoords(el);
    if (!coords) continue;

    const key = `${el.type}-${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dist = haversine(lat, lon, coords.lat, coords.lon);
    const decay = decayScore(dist);

    const tags = el.tags || {};
    let weight = 1;
    if (tags.highway === 'cycleway') weight = 3;
    if (tags.cycleway && tags.cycleway !== 'no') weight = 2;
    if (tags.bicycle === 'designated') weight = 2;

    totalScore += decay * weight;
  }

  return Math.min(100, Math.round((totalScore / 20) * 100));
}

export async function getWalkScore(lat: number, lon: number, _address: string): Promise<WalkScoreResponse> {
  try {
    const walkQuery = `[out:json][timeout:10];(nwr["amenity"~"^(restaurant|cafe|school|library|cinema|theatre|bank|pharmacy|doctors|clinic|hospital)$"](around:${SEARCH_RADIUS},${lat},${lon});nwr["shop"~"^(supermarket|convenience|grocery|clothes|department_store|mall|general|books)$"](around:${SEARCH_RADIUS},${lat},${lon});nwr["leisure"~"^(park|fitness_centre)$"](around:${SEARCH_RADIUS},${lat},${lon}););out center;`;

    const transitQuery = `[out:json][timeout:10];(nwr["highway"="bus_stop"](around:${SEARCH_RADIUS},${lat},${lon});nwr["public_transport"~"^(stop_position|station|platform)$"](around:${SEARCH_RADIUS},${lat},${lon});nwr["railway"~"^(station|halt|tram_stop)$"](around:${SEARCH_RADIUS},${lat},${lon});nwr["amenity"="bus_station"](around:${SEARCH_RADIUS},${lat},${lon}););out center;`;

    const bikeQuery = `[out:json][timeout:10];(nwr["amenity"~"^(bicycle_parking|bicycle_rental)$"](around:${SEARCH_RADIUS},${lat},${lon});way["highway"="cycleway"](around:${SEARCH_RADIUS},${lat},${lon});way["cycleway"~"."](around:${SEARCH_RADIUS},${lat},${lon});way["bicycle"="designated"](around:${SEARCH_RADIUS},${lat},${lon}););out center;`;

    const [walkElements, transitElements, bikeElements] = await Promise.all([
      queryOverpass(walkQuery),
      queryOverpass(transitQuery),
      queryOverpass(bikeQuery),
    ]);

    return {
      walkScore: computeWalkScore(walkElements, lat, lon),
      transitScore: computeTransitScore(transitElements, lat, lon),
      bikeScore: computeBikeScore(bikeElements, lat, lon),
    };
  } catch (err) {
    console.error('[walkability] Overpass API error:', err);
    return { walkScore: null, transitScore: null, bikeScore: null };
  }
}
