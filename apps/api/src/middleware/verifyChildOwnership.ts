import { supabase } from '../supabase';

export async function verifyChildOwnership(childId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('user_id', userId)
    .single();
  return !!data;
}
