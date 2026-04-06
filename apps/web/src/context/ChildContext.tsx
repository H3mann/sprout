import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
}

interface ChildContextValue {
  children: Child[];
  activeChild: Child | null;
  setActiveChildId: (id: string) => void;
  addChild: (child: Omit<Child, 'id'>) => void;
  updateChild: (id: string, updates: Partial<Omit<Child, 'id'>>) => void;
  removeChild: (id: string) => void;
  getAgeMonths: (child: Child) => number;
  getAgeDisplay: (child: Child) => string;
}

const ChildContext = createContext<ChildContextValue | null>(null);

const STORAGE_KEY = 'sprout_children';
const ACTIVE_KEY = 'sprout_active_child';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadChildren(): Child[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveChildren(children: Child[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
}

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>(loadChildren);
  const [activeChildId, setActiveChildId] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) || ''
  );

  const activeChild = children.find((c) => c.id === activeChildId) || children[0] || null;

  useEffect(() => {
    saveChildren(children);
  }, [children]);

  useEffect(() => {
    if (activeChild) {
      localStorage.setItem(ACTIVE_KEY, activeChild.id);
    }
  }, [activeChild]);

  const addChild = useCallback((child: Omit<Child, 'id'>) => {
    const newChild: Child = { ...child, id: generateId() };
    setChildren((prev) => {
      const next = [...prev, newChild];
      // Auto-select if first child
      if (next.length === 1) {
        setActiveChildId(newChild.id);
      }
      return next;
    });
  }, []);

  const updateChild = useCallback((id: string, updates: Partial<Omit<Child, 'id'>>) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const removeChild = useCallback((id: string) => {
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
