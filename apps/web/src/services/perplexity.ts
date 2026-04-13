export interface PerplexityResult {
  answer: string;
  citations: { title: string; url: string }[];
}

const MEDICAL_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'medlineplus.gov',
  'who.int',
  'aap.org',
  'cdc.gov',
  'mayoclinic.org',
  'healthychildren.org',
  'nih.gov',
  'clevelandclinic.org'
];

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function searchPerplexity(query: string): Promise<PerplexityResult> {
  const response = await fetch(`${API_BASE}/search/perplexity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preset: 'fast-search',
      input: `You are a pediatric health research assistant. Answer the following question using only peer-reviewed medical sources. Write in clear, parent-friendly language. Focus on pediatric and child health.\n\nQuestion: ${query}`,
      tools: [
        {
          type: 'web_search',
          filters: {
            search_domain_filter: MEDICAL_DOMAINS
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Search error: ${response.status}`);
  }

  const data = await response.json();

  return {
    answer: extractAnswer(data),
    citations: extractCitations(data)
  };
}

// Response shape:
// output: [
//   { type: 'search_results', results: [{ title, url, id, snippet }] },
//   { type: 'message', content: [{ type: 'output_text', text: '...' }] }
// ]

interface OutputBlock {
  type: string;
  results?: Array<{ title?: string; url?: string; id?: number }>;
  content?: Array<{ type: string; text?: string }>;
}

function extractAnswer(data: { output?: OutputBlock[] }): string {
  if (!Array.isArray(data.output)) return 'No answer returned.';

  for (const block of data.output) {
    if (block.type === 'message' && Array.isArray(block.content)) {
      for (const content of block.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text;
        }
      }
    }
  }

  return 'No answer returned.';
}

function extractCitations(data: { output?: OutputBlock[] }): { title: string; url: string }[] {
  if (!Array.isArray(data.output)) return [];

  for (const block of data.output) {
    if (block.type === 'search_results' && Array.isArray(block.results)) {
      return block.results
        .filter((r) => r.url && r.title)
        .map((r) => ({ title: r.title!, url: r.url! }));
    }
  }

  return [];
}
