import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { childrenApi, type ApiChild } from '../services/api';

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  weightKg?: number | null;
  heightCm?: number | null;
}

interface ChildContextValue {
  children: Child[];
  activeChild: Child | null;
  loading: boolean;
  setActiveChildId: (id: string) => void;
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (id: string, updates: Partial<Omit<Child, 'id'>>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  getAgeMonths: (child: Child) => number;
  getAgeDisplay: (child: Child) => string;
}

const ChildContext = createContext<ChildContextValue | null>(null);

const ACTIVE_KEY = 'sprout_active_child';

function toChild(api: ApiChild): Child {
  return {
    id: api.id,
    name: api.name,
    dateOfBirth: api.date_of_birth,
    gender: api.gender,
    photoUrl: api.photo_url || undefined,
    weightKg: api.weight_kg,
    heightCm: api.height_cm,
  };
}

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChildId, setActiveChildId] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) || ''
  );

  const activeChild = children.find((c) => c.id === activeChildId) || children[0] || null;

  // Load children from API on mount
  useEffect(() => {
    childrenApi.list()
      .then((data) => {
        setChildren(data.map(toChild));
      })
      .catch((err) => console.error('Failed to load children:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeChild) {
      localStorage.setItem(ACTIVE_KEY, activeChild.id);
    }
  }, [activeChild]);

  const addChild = useCallback(async (child: Omit<Child, 'id'>) => {
    const created = await childrenApi.create({
      name: child.name,
      date_of_birth: child.dateOfBirth,
      gender: child.gender,
      photo_url: child.photoUrl,
      weight_kg: child.weightKg ?? undefined,
      height_cm: child.heightCm ?? undefined,
    });
    const newChild = toChild(created);
    setChildren((prev) => {
      const next = [...prev, newChild];
      if (next.length === 1) {
        setActiveChildId(newChild.id);
      }
      return next;
    });
  }, []);

  const updateChild = useCallback(async (id: string, updates: Partial<Omit<Child, 'id'>>) => {
    const apiUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) apiUpdates.name = updates.name;
    if (updates.dateOfBirth !== undefined) apiUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.gender !== undefined) apiUpdates.gender = updates.gender;
    if (updates.photoUrl !== undefined) apiUpdates.photo_url = updates.photoUrl;
    if (updates.weightKg !== undefined) apiUpdates.weight_kg = updates.weightKg;
    if (updates.heightCm !== undefined) apiUpdates.height_cm = updates.heightCm;

    const updated = await childrenApi.update(id, apiUpdates as Parameters<typeof childrenApi.update>[1]);
    setChildren((prev) => prev.map((c) => (c.id === id ? toChild(updated) : c)));
  }, []);

  const removeChild = useCallback(async (id: string) => {
    await childrenApi.remove(id);
    setChildren((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeChildId === id) {
        setActiveChildId(next[0]?.id || '');
      }
      return next;
    });
  }, [activeChildId]);

  const getAgeMonths = useCallback((child: Child) => {
    const dob = new Date(child.dateOfBirth);
    const now = new Date();
    return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  }, []);

  const getAgeDisplay = useCallback((child: Child) => {
    const months = getAgeMonths(child);
    if (months < 1) return 'Newborn';
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (m === 0) return `${y} year${y === 1 ? '' : 's'}`;
    return `${y}y ${m}m`;
  }, [getAgeMonths]);

  return (
    <ChildContext.Provider
      value={{
        children,
        activeChild,
        loading,
        setActiveChildId,
        addChild,
        updateChild,
        removeChild,
        getAgeMonths,
        getAgeDisplay
      }}
    >
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChildren() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChildren must be used within ChildProvider');
  return ctx;
}
