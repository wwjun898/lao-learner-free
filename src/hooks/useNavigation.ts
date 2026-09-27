import { useState, useCallback } from 'react';

export type Page = 'home' | 'vocabulary' | 'dialogue' | 'flashcard'
  | 'search' | 'analysis-library' | 'favorites' | 'stats' | 'calculator' | 'scenario' | 'word-formation' | 'generate-scene' | 'phrase-blocks';

// Free edition keeps the entry cards visible while reserving AI services for a later release.
export const FREE_VERSION_LOCKED_PAGES: Page[] = ['search', 'analysis-library', 'generate-scene'];

export function useNavigation() {
  const [page, setPage] = useState<Page>('home');
  const [history, setHistory] = useState<Page[]>(['home']);

  const navigate = useCallback((newPage: Page) => {
    if (FREE_VERSION_LOCKED_PAGES.includes(newPage)) return;
    setHistory(prev => [...prev, newPage]);
    setPage(newPage);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setPage(newHistory[newHistory.length - 1]);
    }
  }, [history]);

  return { page, navigate, goBack, canGoBack: history.length > 1 };
}
