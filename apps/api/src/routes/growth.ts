import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET growth entries for a child
router.get('/:childId', async (req, res) => {
  const { data, error } = await supabase
    .from('growth_entries')
    .select('*')
    .eq('child_id', req.params.childId)
    .order('recorded_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST create growth entry
router.post('/', async (req, res) => {
  const { child_id, weight_kg, height_cm, head_circumference_cm, recorded_at } = req.body;

  const { data, error } = await supabase
    .from('growth_entries')
    .insert({ child_id, weight_kg, height_cm, head_circumference_cm, recorded_at })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update growth entry
router.put('/:id', async (req, res) => {
  const { weight_kg, height_cm, head_circumference_cm, recorded_at } = req.body;

  const { data, error } = await supabase
    .from('growth_entries')
    .update({ weight_kg, height_cm, head_circumference_cm, recorded_at })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE growth entry
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('growth_entries')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
