import { useEffect, useState } from 'react';
import { useVocabulary } from './useVocabulary';
import { useScenarioPhrases } from './useScenarioPhrases';
import { renameIndustryCategory } from '../data/industryCategory';

export type ReviewSource = 'vocabulary' | 'dialogue' | 'analysis' | 'scenario';
export interface ReviewCard {
  lao: string;
  chinese: string;
  pinyin: string;
  category: string;
  source: ReviewSource;
}
const key = 'lao-learner-review-cards-v2';
const eventName = 'lao-review-changed';
export const reviewId = (card: ReviewCard) => JSON.stringify([card.source, card.category, card.lao]);

function read(): ReviewCard[] | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('翻卡数据无法读取');
  return data.map((card: ReviewCard) => card.source === 'scenario'
    ? { ...card, category: renameIndustryCategory(card.category) } : card);
}

export function useReview() {
  const { priorityWords } = useVocabulary();
  const { customPhrases } = useScenarioPhrases();
  const [cards, setCards] = useState<ReviewCard[]>(() => read() ?? [
    ...priorityWords.map(word => ({ ...word, source: 'vocabulary' as const })),
    ...customPhrases.filter(word => word.priority).map(word => ({ ...word, source: 'scenario' as const })),
  ]);
  useEffect(() => {
    // Preserve existing priority words once; removals must never re-import them.
    if (read() === null) localStorage.setItem(key, JSON.stringify(cards));
    const sync = () => setCards(read() ?? []);
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener('storage', sync); };
  }, [cards]);
  function persist(next: ReviewCard[]) {
    localStorage.setItem(key, JSON.stringify(next));
    setCards(next);
    window.dispatchEvent(new Event(eventName));
  }
  function add(card: ReviewCard) {
    const previous = read() ?? cards;
    persist([...previous.filter(item => reviewId(item) !== reviewId(card)), card]);
  }
  function remove(card: ReviewCard) {
    persist((read() ?? cards).filter(item => reviewId(item) !== reviewId(card)));
  }
  const has = (card: ReviewCard) => cards.some(item => reviewId(item) === reviewId(card));
  function toggle(card: ReviewCard) { if (has(card)) remove(card); else add(card); }
  return { cards, add, remove, has, toggle };
}
