import { useCallback, useMemo, useState } from 'react';
import { normalizeVocabularyCategory, vocabulary as builtInVocabulary, type VocabItem } from '../data/vocabulary';
import type { LaoAnalysis } from '../types/ai';
import { normalizeAnalysisRomanization, toPlainRomanization } from '../lib/romanization';

export interface CustomVocabItem extends VocabItem {
  analysis: LaoAnalysis;
  priority: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'lao-learner-custom-vocabulary';
const PRIORITY_STORAGE_KEY = 'lao-learner-priority-vocabulary';
const CATEGORY_OVERRIDES_STORAGE_KEY = 'lao-learner-vocabulary-category-overrides';

function loadCategoryOverrides(): Record<string, string> {
  try {
    const data = localStorage.getItem(CATEGORY_OVERRIDES_STORAGE_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const overrides: Record<string, string> = {};
    for (const [lao, category] of Object.entries(parsed)) {
      if (typeof category !== 'string') continue;
      if (category.trim()) overrides[lao] = category.trim();
    }
    return overrides;
  } catch {
    return {};
  }
}

function persistCategoryOverrides(overrides: Record<string, string>) {
  localStorage.setItem(CATEGORY_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function loadCustomVocabulary(): CustomVocabItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.map(item => ({
      ...item,
      category: item.category?.trim() || normalizeVocabularyCategory('', item.chinese ?? ''),
      pinyin: toPlainRomanization(item.pinyin ?? ''),
      analysis: item.analysis ? normalizeAnalysisRomanization(item.analysis) : item.analysis,
    })) : [];
  } catch {
    return [];
  }
}

function persistCustomVocabulary(words: CustomVocabItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function loadPriorityVocabulary(customWords: CustomVocabItem[]): string[] {
  try {
    const data = localStorage.getItem(PRIORITY_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.filter(item => typeof item === 'string');
    }
  } catch {
    // Fall through to migration from the original custom-word priority field.
  }
  return customWords.filter(item => item.priority).map(item => item.lao);
}

function persistPriorityVocabulary(words: string[]) {
  localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(words));
}

export function useVocabulary() {
  const [customWords, setCustomWords] = useState<CustomVocabItem[]>(loadCustomVocabulary);
  const [priorityKeys, setPriorityKeys] = useState<string[]>(() => loadPriorityVocabulary(customWords));
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>(loadCategoryOverrides);

  const saveCustomWord = useCallback((word: CustomVocabItem) => {
    const normalizedWord = {
      ...word,
      category: word.category.trim() || normalizeVocabularyCategory('', word.chinese),
      pinyin: toPlainRomanization(word.pinyin),
      analysis: normalizeAnalysisRomanization(word.analysis),
    };
    setCustomWords(previous => {
      const next = [...previous.filter(item => item.lao !== normalizedWord.lao), normalizedWord];
      persistCustomVocabulary(next);
      return next;
    });
    setCategoryOverrides(previous => {
      const next = { ...previous, [normalizedWord.lao]: normalizedWord.category };
      persistCategoryOverrides(next);
      return next;
    });
    if (normalizedWord.priority) {
      setPriorityKeys(previous => {
        const next = previous.includes(normalizedWord.lao) ? previous : [...previous, normalizedWord.lao];
        persistPriorityVocabulary(next);
        return next;
      });
    }
  }, []);

  const removeCustomWord = useCallback((lao: string) => {
    setCustomWords(previous => {
      const next = previous.filter(item => item.lao !== lao);
      persistCustomVocabulary(next);
      return next;
    });
    setPriorityKeys(previous => {
      const next = previous.filter(item => item !== lao);
      persistPriorityVocabulary(next);
      return next;
    });
  }, []);

  const togglePriority = useCallback((lao: string) => {
    setCustomWords(previous => {
      const next = previous.map(item => item.lao === lao
        ? { ...item, priority: !item.priority }
        : item);
      persistCustomVocabulary(next);
      return next;
    });
    setPriorityKeys(previous => {
      const next = previous.includes(lao)
        ? previous.filter(item => item !== lao)
        : [...previous, lao];
      persistPriorityVocabulary(next);
      return next;
    });
  }, []);

  const removePriority = useCallback((lao: string) => {
    setCustomWords(previous => {
      const next = previous.map(item => item.lao === lao
        ? { ...item, priority: false }
        : item);
      persistCustomVocabulary(next);
      return next;
    });
    setPriorityKeys(previous => {
      const next = previous.filter(item => item !== lao);
      persistPriorityVocabulary(next);
      return next;
    });
  }, []);

  const moveToCategory = useCallback((lao: string, category: string) => {
    if (!category.trim()) return;
    setCategoryOverrides(previous => {
      const next = { ...previous, [lao]: category };
      persistCategoryOverrides(next);
      return next;
    });
  }, []);

  const vocabulary = useMemo(() => {
    const customKeys = new Set(customWords.map(item => item.lao));
    const words = [
      ...builtInVocabulary.filter(item => !customKeys.has(item.lao)),
      ...customWords,
    ];
    const seen = new Set<string>();
    return words.map(item => ({
      ...item,
      category: categoryOverrides[item.lao] ?? item.category,
    })).filter(item => {
      // Moving a word shared by several topics must not create duplicate cards.
      const key = JSON.stringify([item.category, item.lao]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoryOverrides, customWords]);

  const priorityWords = useMemo(
    () => vocabulary.filter((item, index, all) => priorityKeys.includes(item.lao)
      && all.findIndex(other => other.lao === item.lao) === index),
    [priorityKeys, vocabulary],
  );

  const isCustomWord = useCallback(
    (lao: string) => customWords.some(item => item.lao === lao),
    [customWords],
  );

  const isPriority = useCallback(
    (lao: string) => priorityKeys.includes(lao),
    [priorityKeys],
  );

  return {
    vocabulary,
    customWords,
    priorityWords,
    saveCustomWord,
    removeCustomWord,
    togglePriority,
    removePriority,
    moveToCategory,
    isCustomWord,
    isPriority,
  };
}
