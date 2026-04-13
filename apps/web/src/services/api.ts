import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Session expired. Please sign in again.');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// --- Children ---

export interface ApiChild {
  id: string;
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  photo_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  created_at: string;
  updated_at: string;
}

export const childrenApi = {
  list: () => request<ApiChild[]>('/children'),
  get: (id: string) => request<ApiChild>(`/children/${id}`),
  create: (child: { name: string; date_of_birth: string; gender: string; photo_url?: string; weight_kg?: number; height_cm?: number }) =>
    request<ApiChild>('/children', { method: 'POST', body: JSON.stringify(child) }),
  update: (id: string, updates: Partial<{ name: string; date_of_birth: string; gender: string; photo_url: string; weight_kg: number | null; height_cm: number | null }>) =>
    request<ApiChild>(`/children/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id: string) => request<void>(`/children/${id}`, { method: 'DELETE' }),
};

// --- Growth Entries ---

export interface ApiGrowthEntry {
  id: string;
  child_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  recorded_at: string;
  created_at: string;
}

export const growthApi = {
  list: (childId: string) => request<ApiGrowthEntry[]>(`/growth/${childId}`),
  create: (entry: { child_id: string; weight_kg?: number; height_cm?: number; head_circumference_cm?: number; recorded_at: string }) =>
    request<ApiGrowthEntry>('/growth', { method: 'POST', body: JSON.stringify(entry) }),
  update: (id: string, updates: Partial<{ weight_kg: number; height_cm: number; head_circumference_cm: number; recorded_at: string }>) =>
    request<ApiGrowthEntry>(`/growth/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id: string) => request<void>(`/growth/${id}`, { method: 'DELETE' }),
};

// --- Visit Prep ---

export interface ApiVisitPrepItem {
  id: string;
  child_id: string;
  question: string;
  source: 'research' | 'faq' | 'manual';
  added_at: string;
}

// --- Milestones ---

export interface ApiMilestoneCompletion {
  id: string;
  child_id: string;
  milestone_id: string;
  completed_at: string;
}

export const milestonesApi = {
  list: (childId: string) => request<ApiMilestoneCompletion[]>(`/milestones/${childId}`),
  complete: (childId: string, milestoneId: string) =>
    request<ApiMilestoneCompletion>('/milestones', { method: 'POST', body: JSON.stringify({ child_id: childId, milestone_id: milestoneId }) }),
  uncomplete: (childId: string, milestoneId: string) =>
    request<void>(`/milestones/${childId}/${milestoneId}`, { method: 'DELETE' }),
};

// --- Vaccines ---

export interface ApiVaccineRecord {
  id: string;
  child_id: string;
  vaccine_id: string;
  status: 'completed' | 'due' | 'upcoming' | 'overdue';
  date_administered: string | null;
  provider: string | null;
  lot_number: string | null;
  notes: string | null;
  updated_at: string;
}

export const vaccinesApi = {
  list: (childId: string) => request<ApiVaccineRecord[]>(`/vaccines/${childId}`),
  upsert: (record: { child_id: string; vaccine_id: string; status: string; date_administered?: string; provider?: string; lot_number?: string; notes?: string }) =>
    request<ApiVaccineRecord>('/vaccines', { method: 'POST', body: JSON.stringify(record) }),
  remove: (childId: string, vaccineId: string) =>
    request<void>(`/vaccines/${childId}/${vaccineId}`, { method: 'DELETE' }),
};

// --- Visit Prep ---

export const visitPrepApi = {
  list: (childId?: string) =>
    request<ApiVisitPrepItem[]>(`/visit-prep${childId ? `?child_id=${childId}` : ''}`),
  create: (item: { child_id: string; question: string; source?: string }) =>
    request<ApiVisitPrepItem>('/visit-prep', { method: 'POST', body: JSON.stringify(item) }),
  remove: (id: string) => request<void>(`/visit-prep/${id}`, { method: 'DELETE' }),
  clearAll: (childId: string) => request<void>(`/visit-prep/clear/${childId}`, { method: 'DELETE' }),
};
