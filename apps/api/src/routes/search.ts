import { Router } from 'express';

const router = Router();

// Proxy Perplexity API — keeps API key server-side
router.post('/perplexity', async (req, res) => {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Search service not configured.' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      console.error('[search:perplexity]', response.status, await response.text());
      return res.status(response.status).json({ error: 'Search query failed.' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[search:perplexity]', err);
    res.status(500).json({ error: 'Failed to query search service.' });
  }
});

// Proxy MedlinePlus API — avoids CORS in production
router.get('/medlineplus', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query as Record<string, string>);
    const response = await fetch(`https://wsearch.nlm.nih.gov/ws/query?${params}`);

    if (!response.ok) {
      console.error('[search:medlineplus]', response.status);
      return res.status(response.status).json({ error: 'MedlinePlus query failed.' });
    }

    const xml = await response.text();
    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[search:medlineplus]', err);
    res.status(500).json({ error: 'Failed to query MedlinePlus.' });
  }
});

export default router;
