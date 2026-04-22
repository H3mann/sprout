import { Router } from 'express';
import { realmSupabase as supabase } from '../../supabase';

const router = Router();

router.get('/', async (req, res) => {
  if (!req.userId) {
    return res.json([]);
  }

  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[savedSearch:list]', error.message);
      return res.status(500).json({ error: 'Failed to fetch saved searches' });
    }

    res.json(data);
  } catch (err) {
    console.error('[savedSearch:list]', err);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

router.post('/', async (req, res) => {
  const { label, location_type, location_value, state, latitude, longitude } = req.body;

  if (!label || !location_type || !location_value) {
    return res.status(400).json({ error: 'Label, location_type, and location_value are required' });
  }

  if (!req.userId) {
    return res.status(401).json({ error: 'Sign in to save searches' });
  }

  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: req.userId,
        label,
        location_type,
        location_value,
        state: state || null,
        latitude: latitude || null,
        longitude: longitude || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[savedSearch:create]', error.message);
      return res.status(400).json({ error: 'Failed to save search' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('[savedSearch:create]', err);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Sign in to delete searches' });
  }

  try {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) {
      console.error('[savedSearch:delete]', error.message);
      return res.status(400).json({ error: 'Failed to delete search' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[savedSearch:delete]', err);
    res.status(500).json({ error: 'Failed to delete search' });
  }
});

export default router;
