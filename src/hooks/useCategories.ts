import { useState } from 'react';
import { categories } from '../data/vocabulary';
import { scenarioCategories } from '../data/topicPractice';
import { renameIndustryCategory } from '../data/industryCategory';

export type SaveDestination = 'vocabulary' | 'scenario';
const key = 'lao-learner-custom-categories-v1';

function load(): Record<SaveDestination, string[]> {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    const strings = (items: unknown): string[] => Array.isArray(items)
      ? items.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
    return { vocabulary: strings(value.vocabulary), scenario: strings(value.scenario).map(renameIndustryCategory) };
  } catch { return { vocabulary: [], scenario: [] }; }
}

export function useCategories() {
  const [custom, setCustom] = useState(load);
  const vocabularyCategories = [...new Set([...categories, ...custom.vocabulary])];
  const practiceCategories = [...new Set([...scenarioCategories, ...custom.scenario])];
  function addCategory(destination: SaveDestination, input: string) {
    const name = destination === 'scenario' ? renameIndustryCategory(input.trim()) : input.trim();
    if (!name || name.length > 40) throw new Error('分类名称请输入 1 到 40 个字');
    const next = load();
    next[destination] = [...new Set([...next[destination], name])];
    localStorage.setItem(key, JSON.stringify(next));
    setCustom(next);
    return name;
  }
  return { vocabularyCategories, practiceCategories, addCategory };
}
