import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET all visit prep items (optionally filter by child_id)
router.get('/', async (req, res) => {
  let query = supabase
    .from('visit_prep_items')
    .select('*')
    .order('added_at', { ascending: true });

  if (req.query.child_id) {
    query = query.eq('child_id', req.query.child_id as string);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST create visit prep item
router.post('/', async (req, res) => {
  const { child_id, question, source } = req.body;

  const { data, error } = await supabase
    .from('visit_prep_items')
    .insert({ child_id, question, source: source || 'manual', added_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE visit prep item
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('visit_prep_items')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// DELETE all visit prep items for a child
router.delete('/clear/:childId', async (req, res) => {
  const { error } = await supabase
    .from('visit_prep_items')
    .delete()
    .eq('child_id', req.params.childId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
