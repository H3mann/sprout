import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { visitPrepApi, type ApiVisitPrepItem } from '../services/api';
import { useChildren } from './ChildContext';

export interface VisitPrepItem {
  id: string;
  question: string;
  source?: 'research' | 'faq' | 'manual';
  addedAt: string; // ISO date
}

interface VisitPrepContextValue {
  items: VisitPrepItem[];
  loading: boolean;
  addItem: (question: string, source?: VisitPrepItem['source']) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  hasQuestion: (question: string) => boolean;
}

const VisitPrepContext = createContext<VisitPrepContextValue | null>(null);

function toItem(api: ApiVisitPrepItem): VisitPrepItem {
  return {
    id: api.id,
    question: api.question,
    source: api.source,
    addedAt: api.added_at,
  };
}

export function VisitPrepProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<VisitPrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeChild } = useChildren();

  // Load items from API when active child changes
  useEffect(() => {
    if (!activeChild) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    visitPrepApi.list(activeChild.id)
      .then((data) => setItems(data.map(toItem)))
      .catch((err) => console.error('Failed to load visit prep items:', err))
      .finally(() => setLoading(false));
  }, [activeChild]);

  const addItem = useCallback(async (question: string, source: VisitPrepItem['source'] = 'manual') => {
    const trimmed = question.trim();
    if (!trimmed || !activeChild) return;
    if (items.some((item) => item.question.toLowerCase() === trimmed.toLowerCase())) return;

    const created = await visitPrepApi.create({
      child_id: activeChild.id,
      question: trimmed,
      source,
    });
    setItems((prev) => [...prev, toItem(created)]);
  }, [activeChild, items]);

  const removeItem = useCallback(async (id: string) => {
    await visitPrepApi.remove(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    if (!activeChild) return;
    await visitPrepApi.clearAll(activeChild.id);
    setItems([]);
  }, [activeChild]);

  const hasQuestion = useCallback((question: string) => {
    return items.some((item) => item.question.toLowerCase() === question.trim().toLowerCase());
  }, [items]);

  return (
    <VisitPrepContext.Provider value={{ items, loading, addItem, removeItem, clearAll, hasQuestion }}>
      {children}
    </VisitPrepContext.Provider>
  );
}

export function useVisitPrep() {
  const ctx = useContext(VisitPrepContext);
  if (!ctx) throw new Error('useVisitPrep must be used within VisitPrepProvider');
  return ctx;
}
