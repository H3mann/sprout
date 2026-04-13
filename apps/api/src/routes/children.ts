import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET all children for authenticated user
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single child (must belong to user)
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// POST create child
router.post('/', async (req, res) => {
  const { name, date_of_birth, gender, photo_url, weight_kg, height_cm } = req.body;

  const { data, error } = await supabase
    .from('children')
    .insert({ name, date_of_birth, gender, photo_url, weight_kg, height_cm, user_id: req.userId! })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update child (must belong to user)
router.put('/:id', async (req, res) => {
  const { name, date_of_birth, gender, photo_url, weight_kg, height_cm } = req.body;

  const { data, error } = await supabase
    .from('children')
    .update({ name, date_of_birth, gender, photo_url, weight_kg, height_cm })
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE child (must belong to user)
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId!);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
