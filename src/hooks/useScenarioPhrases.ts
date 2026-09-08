import { useCallback, useState } from 'react';
import { toPlainRomanization } from '../lib/romanization';
import { normalizeScenarioCategory } from '../data/topicPractice';

export interface CustomScenarioPhrase {
  lao: string;
  chinese: string;
  pinyin: string;
  category: string;
  priority: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'lao-learner-custom-scenario-phrases';

function loadPhrases(): CustomScenarioPhrase[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => ({
      ...item,
      category: item.category?.trim() || normalizeScenarioCategory(''),
      pinyin: toPlainRomanization(item.pinyin ?? ''),
    })) : [];
  } catch {
    return [];
  }
}

export function useScenarioPhrases() {
  const [customPhrases, setCustomPhrases] = useState<CustomScenarioPhrase[]>(loadPhrases);

  const saveCustomPhrase = useCallback((phrase: CustomScenarioPhrase) => {
    const normalizedPhrase = {
      ...phrase,
      category: phrase.category.trim() || normalizeScenarioCategory(''),
      pinyin: toPlainRomanization(phrase.pinyin),
    };
    setCustomPhrases(previous => {
      const next = [...previous.filter(item => item.lao !== normalizedPhrase.lao), normalizedPhrase];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removePriority = useCallback((lao: string) => {
    setCustomPhrases(previous => {
      const next = previous.map(item => item.lao === lao
        ? { ...item, priority: false }
        : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { customPhrases, saveCustomPhrase, removePriority };
}
