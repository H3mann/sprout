import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET vaccine records for a child
router.get('/:childId', async (req, res) => {
  const { data, error } = await supabase
    .from('vaccine_records')
    .select('*')
    .eq('child_id', req.params.childId)
    .order('updated_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST/upsert vaccine record
router.post('/', async (req, res) => {
  const { child_id, vaccine_id, status, date_administered, provider, lot_number, notes } = req.body;

  const { data, error } = await supabase
    .from('vaccine_records')
    .upsert(
      { child_id, vaccine_id, status, date_administered, provider, lot_number, notes, updated_at: new Date().toISOString() },
      { onConflict: 'child_id,vaccine_id' }
    )
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE vaccine record
router.delete('/:childId/:vaccineId', async (req, res) => {
  const { error } = await supabase
    .from('vaccine_records')
    .delete()
    .eq('child_id', req.params.childId)
    .eq('vaccine_id', req.params.vaccineId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
