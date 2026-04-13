import { Router } from 'express';
import { supabase } from '../supabase';
import { verifyChildOwnership } from '../middleware/verifyChildOwnership';

const router = Router();

// GET all visit prep items (optionally filter by child_id)
router.get('/', async (req, res) => {
  const childId = req.query.child_id as string | undefined;

  if (childId) {
    const owns = await verifyChildOwnership(childId, req.userId!);
    if (!owns) return res.status(403).json({ error: 'Access denied' });

    const { data, error } = await supabase
      .from('visit_prep_items')
      .select('*')
      .eq('child_id', childId)
      .order('added_at', { ascending: true });

    if (error) { console.error('[visitPrep:list]', error.message); return res.status(500).json({ error: 'Failed to fetch visit prep items.' }); }
    return res.json(data);
  }

  // No child_id filter: return items for all of the user's children
  const { data: userChildren } = await supabase
    .from('children')
    .select('id')
    .eq('user_id', req.userId!);

  const childIds = (userChildren || []).map((c) => c.id);
  if (childIds.length === 0) return res.json([]);

  const { data, error } = await supabase
    .from('visit_prep_items')
    .select('*')
    .in('child_id', childIds)
    .order('added_at', { ascending: true });

  if (error) { console.error('[visitPrep:list]', error.message); return res.status(500).json({ error: 'Failed to fetch visit prep items.' }); }
  res.json(data);
});

// POST create visit prep item
router.post('/', async (req, res) => {
  const { child_id, question, source } = req.body;

  const owns = await verifyChildOwnership(child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { data, error } = await supabase
    .from('visit_prep_items')
    .insert({ child_id, question, source: source || 'manual', added_at: new Date().toISOString() })
    .select()
    .single();

  if (error) { console.error('[visitPrep:create]', error.message); return res.status(400).json({ error: 'Failed to create visit prep item.' }); }
  res.status(201).json(data);
});

// DELETE visit prep item
router.delete('/:id', async (req, res) => {
  const { data: item } = await supabase
    .from('visit_prep_items')
    .select('child_id')
    .eq('id', req.params.id)
    .single();
  if (!item) return res.status(404).json({ error: 'Not found' });

  const owns = await verifyChildOwnership(item.child_id, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { error } = await supabase
    .from('visit_prep_items')
    .delete()
    .eq('id', req.params.id);

  if (error) { console.error('[visitPrep:delete]', error.message); return res.status(400).json({ error: 'Failed to delete visit prep item.' }); }
  res.status(204).send();
});

// DELETE all visit prep items for a child
router.delete('/clear/:childId', async (req, res) => {
  const owns = await verifyChildOwnership(req.params.childId, req.userId!);
  if (!owns) return res.status(403).json({ error: 'Access denied' });

  const { error } = await supabase
    .from('visit_prep_items')
    .delete()
    .eq('child_id', req.params.childId);

  if (error) { console.error('[visitPrep:clearAll]', error.message); return res.status(400).json({ error: 'Failed to clear visit prep items.' }); }
  res.status(204).send();
});

export default router;
