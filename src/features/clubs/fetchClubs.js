import { supabase } from '../../config/supabase.js';
import { clubView } from './clubView.js';
export async function fetchClubs(options = {}) {
  const { status = 'approved', search = '', limit = 50 } = options;

  let query = supabase
    .from('clubs')
    .select(clubView)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function fetchClubById(id) {
  const { data, error } = await supabase
    .from('clubs')
    .select(clubView)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function fetchClubsByLeader(leaderId) {
  const { data, error } = await supabase
    .from('clubs')
    .select(clubView)
    .eq('leader_id', leaderId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
