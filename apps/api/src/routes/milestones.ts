import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET completed milestones for a child
router.get('/:childId', async (req, res) => {
  const { data, error } = await supabase
    .from('milestone_completions')
    .select('*')
    .eq('child_id', req.params.childId)
    .order('completed_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST mark milestone complete
router.post('/', async (req, res) => {
  const { child_id, milestone_id } = req.body;

  const { data, error } = await supabase
    .from('milestone_completions')
    .upsert({ child_id, milestone_id }, { onConflict: 'child_id,milestone_id' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE unmark milestone
router.delete('/:childId/:milestoneId', async (req, res) => {
  const { error } = await supabase
    .from('milestone_completions')
    .delete()
    .eq('child_id', req.params.childId)
    .eq('milestone_id', req.params.milestoneId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
