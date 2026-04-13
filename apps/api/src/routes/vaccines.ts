import { Router } from 'express';
import { supabase } from '../supabase';
import { verifyChildOwnership } from '../middleware/verifyChildOwnership';

const router = Router();

// GET vaccine records for a child
router.get('/:childId', async (req, res) => {
  const owns = await verifyChildOwnership(req.params.childId, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

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

  const owns = await verifyChildOwnership(child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

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
  const owns = await verifyChildOwnership(req.params.childId, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { error } = await supabase
    .from('vaccine_records')
    .delete()
    .eq('child_id', req.params.childId)
    .eq('vaccine_id', req.params.vaccineId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
