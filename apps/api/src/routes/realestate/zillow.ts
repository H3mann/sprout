import { Router } from 'express';
import { realmSupabase as supabase } from '../../supabase';

const router = Router();

router.get('/home-values', async (req, res) => {
  const region = req.query.region as string;
  const type = (req.query.type as string) || 'zip';

  if (!region) {
    return res.status(400).json({ error: 'Region parameter is required' });
  }

  try {
    const { data, error } = await supabase
      .from('zillow_home_values')
      .select('region_name, region_type, state, date, zhvi')
      .eq('region_name', region)
      .eq('region_type', type)
      .order('date', { ascending: true });

    if (error) {
      console.error('[zillow:home-values]', error.message);
      return res.status(500).json({ error: 'Failed to fetch home values' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[zillow:home-values]', err);
    res.status(500).json({ error: 'Failed to fetch home values' });
  }
});

router.get('/rent-index', async (req, res) => {
  const region = req.query.region as string;
  const type = (req.query.type as string) || 'zip';

  if (!region) {
    return res.status(400).json({ error: 'Region parameter is required' });
  }

  try {
    const { data, error } = await supabase
      .from('zillow_rent_index')
      .select('region_name, region_type, state, date, zori')
      .eq('region_name', region)
      .eq('region_type', type)
      .order('date', { ascending: true });

    if (error) {
      console.error('[zillow:rent-index]', error.message);
      return res.status(500).json({ error: 'Failed to fetch rent index' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[zillow:rent-index]', err);
    res.status(500).json({ error: 'Failed to fetch rent index' });
  }
});

export default router;
