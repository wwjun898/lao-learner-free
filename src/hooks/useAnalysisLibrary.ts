import { useCallback, useState } from 'react';
import { normalizeAnalysisRomanization } from '../lib/romanization';
import type { AnalysisResponse, LaoAnalysis } from '../types/ai';
import { normalizeVocabularyCategory } from '../data/vocabulary';

export interface AnalysisLibraryEntry {
  id: string;
  analysis: LaoAnalysis;
  category: string;
  provider: AnalysisResponse['provider'] | 'unknown';
  model: string;
  savedAt: string;
}

const STORAGE_KEY = 'lao-learner-analysis-library';
const LEGACY_VOCABULARY_KEY = 'lao-learner-custom-vocabulary';

function normalizeEntry(entry: AnalysisLibraryEntry): AnalysisLibraryEntry {
  return {
    ...entry,
    category: normalizeVocabularyCategory(entry.category, entry.analysis.chineseMeaning),
    analysis: normalizeAnalysisRomanization(entry.analysis),
  };
}

function migrateLegacyEntries(): AnalysisLibraryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_VOCABULARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap(item => {
      if (!item?.analysis?.normalizedLao) return [];
      const analysis = normalizeAnalysisRomanization(item.analysis as LaoAnalysis);
      return [{
        id: analysis.normalizedLao,
        analysis,
        category: normalizeVocabularyCategory(
          typeof item.category === 'string' ? item.category : analysis.suggestedCategory,
          analysis.chineseMeaning,
        ),
        provider: 'unknown' as const,
        model: '历史解析',
        savedAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      }];
    });
  } catch {
    return [];
  }
}

function loadEntries(): AnalysisLibraryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const entries = stored ? JSON.parse(stored) : migrateLegacyEntries();
    if (!Array.isArray(entries)) return [];
    const normalized = entries.map(normalizeEntry);
    if (!stored && normalized.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

function persist(entries: AnalysisLibraryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useAnalysisLibrary() {
  const [entries, setEntries] = useState<AnalysisLibraryEntry[]>(loadEntries);

  const saveEntry = useCallback((response: AnalysisResponse, category = response.analysis.suggestedCategory) => {
    const analysis = normalizeAnalysisRomanization(response.analysis);
    const entry: AnalysisLibraryEntry = {
      id: analysis.normalizedLao,
      analysis,
      category: normalizeVocabularyCategory(category, analysis.chineseMeaning),
      provider: response.provider,
      model: response.model,
      savedAt: new Date().toISOString(),
    };
    setEntries(previous => {
      const next = [entry, ...previous.filter(item => item.id !== entry.id)];
      persist(next);
      return next;
    });
  }, []);

  const updateCategory = useCallback((id: string, category: string) => {
    setEntries(previous => {
      const next = previous.map(item => item.id === id
        ? { ...item, category: normalizeVocabularyCategory(category, item.analysis.chineseMeaning) }
        : item);
      persist(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(previous => {
      const next = previous.filter(item => item.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { entries, saveEntry, updateCategory, removeEntry };
}
