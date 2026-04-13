export interface MedlinePlusResult {
  title: string;
  url: string;
  keyPoints: string[];
  fullSummary: string;
  snippet: string;
  relevanceScore: number;
}

function parseXmlText(xml: string, tag: string): string {
  const regex = new RegExp(`<content name="${tag}"[^>]*>([\\s\\S]*?)</content>`);
  const match = xml.match(regex);
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Breaks a wall-of-text summary into digestible key points.
 * Splits on sentence boundaries and groups into logical chunks.
 */
function extractKeyPoints(rawHtml: string): string[] {
  // Parse HTML to preserve list items as separate points
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  const points: string[] = [];

  // Extract list items as individual points
  const listItems = doc.querySelectorAll('li');
  if (listItems.length > 0) {
    listItems.forEach((li) => {
      const text = (li.textContent || '').trim();
      if (text.length > 10) points.push(text);
    });
  }

  // Extract paragraph text, split into sentences
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const text = (p.textContent || '').trim();
    if (!text) return;

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    for (const sentence of sentences) {
      const clean = sentence.trim();
      if (clean.length > 15 && !points.includes(clean)) {
        points.push(clean);
      }
    }
  });

  // If no structured HTML, fall back to splitting plain text
  if (points.length === 0) {
    const plain = doc.body.textContent || '';
    const sentences = plain.match(/[^.!?]+[.!?]+/g) || [];
    for (const sentence of sentences) {
      const clean = sentence.trim();
      if (clean.length > 15) points.push(clean);
    }
  }

  return points.slice(0, 8);
}

/**
 * Scores how relevant a result is to the original query.
 * Higher = more relevant.
 */
function scoreRelevance(query: string, title: string, snippet: string): number {
  const queryWords = query
    .toLowerCase()
    .replace(/[?.,!'"]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'is', 'too', 'how', 'what', 'when', 'does', 'can', 'for', 'and', 'are'].includes(w));

  const titleLower = title.toLowerCase();
  const snippetLower = snippet.toLowerCase();

  let score = 0;

  for (const word of queryWords) {
    if (titleLower.includes(word)) score += 3;
    if (snippetLower.includes(word)) score += 1;
  }

  // Boost if title is a direct match to a key query term
  if (queryWords.some((w) => titleLower === w || titleLower.startsWith(w))) {
    score += 5;
  }

  return score;
}

function parseDocuments(xml: string, query: string): MedlinePlusResult[] {
  const results: MedlinePlusResult[] = [];
  const docRegex = /<document([^>]*)>([\s\S]*?)<\/document>/g;
  let match;

  while ((match = docRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const inner = match[2];

    const urlMatch = attrs.match(/url="([^"]*)"/);
    const url = urlMatch ? urlMatch[1] : '';
    const titleRaw = parseXmlText(inner, 'title');
    const snippetRaw = parseXmlText(inner, 'snippet');
    const summaryRaw = parseXmlText(inner, 'FullSummary') || snippetRaw;

    const title = stripHtml(titleRaw);
    const snippet = stripHtml(snippetRaw);

    if (!title) continue;

    const relevanceScore = scoreRelevance(query, title, snippet);

    // Filter out results with very low relevance
    if (relevanceScore < 2) continue;

    results.push({
      title,
      url,
      keyPoints: extractKeyPoints(summaryRaw),
      fullSummary: stripHtml(summaryRaw),
      snippet,
      relevanceScore
    });
  }

  // Sort by relevance score (highest first), then by original rank
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function searchMedlinePlus(query: string): Promise<MedlinePlusResult[]> {
  const params = new URLSearchParams({
    db: 'healthTopics',
    term: query
  });

  const response = await fetch(`${API_BASE}/search/medlineplus?${params}`);

  if (!response.ok) {
    throw new Error(`MedlinePlus API error: ${response.status}`);
  }

  const xml = await response.text();
  return parseDocuments(xml, query);
}
