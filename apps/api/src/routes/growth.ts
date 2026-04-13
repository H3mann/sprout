import { Router } from 'express';
import { supabase } from '../supabase';
import { verifyChildOwnership } from '../middleware/verifyChildOwnership';

const router = Router();

// GET growth entries for a child
router.get('/:childId', async (req, res) => {
  const owns = await verifyChildOwnership(req.params.childId, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { data, error } = await supabase
    .from('growth_entries')
    .select('*')
    .eq('child_id', req.params.childId)
    .order('recorded_at', { ascending: true });

  if (error) { console.error('[growth:list]', error.message); return res.status(500).json({ error: 'Failed to fetch growth entries.' }); }
  res.json(data);
});

// POST create growth entry
router.post('/', async (req, res) => {
  const { child_id, weight_kg, height_cm, head_circumference_cm, recorded_at } = req.body;

  const owns = await verifyChildOwnership(child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { data, error } = await supabase
    .from('growth_entries')
    .insert({ child_id, weight_kg, height_cm, head_circumference_cm, recorded_at })
    .select()
    .single();

  if (error) { console.error('[growth:create]', error.message); return res.status(400).json({ error: 'Failed to create growth entry.' }); }
  res.status(201).json(data);
});

// PUT update growth entry
router.put('/:id', async (req, res) => {
  const { weight_kg, height_cm, head_circumference_cm, recorded_at } = req.body;

  // Look up the entry to find its child_id
  const { data: entry } = await supabase
    .from('growth_entries')
    .select('child_id')
    .eq('id', req.params.id)
    .single();
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const owns = await verifyChildOwnership(entry.child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { data, error } = await supabase
    .from('growth_entries')
    .update({ weight_kg, height_cm, head_circumference_cm, recorded_at })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error('[growth:update]', error.message); return res.status(400).json({ error: 'Failed to update growth entry.' }); }
  res.json(data);
});

// DELETE growth entry
router.delete('/:id', async (req, res) => {
  const { data: entry } = await supabase
    .from('growth_entries')
    .select('child_id')
    .eq('id', req.params.id)
    .single();
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const owns = await verifyChildOwnership(entry.child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { error } = await supabase
    .from('growth_entries')
    .delete()
    .eq('id', req.params.id);

  if (error) { console.error('[growth:delete]', error.message); return res.status(400).json({ error: 'Failed to delete growth entry.' }); }
  res.status(204).send();
});

export default router;
