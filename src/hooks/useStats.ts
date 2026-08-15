import { useCallback, useEffect, useState } from 'react';

interface DayStats {
  date: string;
  wordsLearned: number;
  learnedWordKeys: string[];
  practiceMinutes: number;
  flashcardScore: number;
  dialoguesPracticed: number;
}

interface StatsState {
  days: Record<string, DayStats>;
  streak: number;
  totalWordsLearned: number;
  learnedWordKeys: string[];
  totalPracticeMinutes: number;
}

const STORAGE_KEY = 'lao-learner-stats';

function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyDay(date: string): DayStats {
  return {
    date,
    wordsLearned: 0,
    learnedWordKeys: [],
    practiceMinutes: 0,
    flashcardScore: 0,
    dialoguesPracticed: 0,
  };
}

function emptyStats(): StatsState {
  return {
    days: {},
    streak: 0,
    totalWordsLearned: 0,
    learnedWordKeys: [],
    totalPracticeMinutes: 0,
  };
}

function loadStats(): StatsState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return emptyStats();
    const parsed = JSON.parse(data) as Partial<StatsState>;
    const days = Object.fromEntries(Object.entries(parsed.days ?? {}).map(([date, day]) => [
      date,
      { ...emptyDay(date), ...day, learnedWordKeys: day.learnedWordKeys ?? [] },
    ]));
    return {
      ...emptyStats(),
      ...parsed,
      days,
      learnedWordKeys: parsed.learnedWordKeys ?? [],
    };
  } catch {
    return emptyStats();
  }
}

function saveStats(state: StatsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hasLearningActivity(day?: DayStats): boolean {
  return Boolean(day && (
    day.wordsLearned > 0
    || day.practiceMinutes > 0
    || day.flashcardScore > 0
    || day.dialoguesPracticed > 0
  ));
}

function calculateStreak(days: Record<string, DayStats>): number {
  let streak = 0;
  const date = new Date();
  while (hasLearningActivity(days[getDateKey(date)])) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

export function useStats() {
  const [stats, setStats] = useState<StatsState>(loadStats);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const recordWordLearned = useCallback((wordKey: string) => {
    if (!wordKey) return;
    setStats(previous => {
      const today = getDateKey();
      const currentDay = previous.days[today] ?? emptyDay(today);
      const isNewToday = !currentDay.learnedWordKeys.includes(wordKey);
      const isNewOverall = !previous.learnedWordKeys.includes(wordKey);
      if (!isNewToday && !isNewOverall) return previous;

      const nextDay: DayStats = {
        ...currentDay,
        wordsLearned: currentDay.wordsLearned + (isNewToday ? 1 : 0),
        learnedWordKeys: isNewToday ? [...currentDay.learnedWordKeys, wordKey] : currentDay.learnedWordKeys,
      };
      const nextDays = { ...previous.days, [today]: nextDay };
      return {
        ...previous,
        days: nextDays,
        streak: calculateStreak(nextDays),
        totalWordsLearned: previous.totalWordsLearned + (isNewOverall ? 1 : 0),
        learnedWordKeys: isNewOverall ? [...previous.learnedWordKeys, wordKey] : previous.learnedWordKeys,
      };
    });
  }, []);

  const recordPractice = useCallback((minutes = 1) => {
    const roundedMinutes = Math.max(1, Math.round(minutes));
    setStats(previous => {
      const today = getDateKey();
      const currentDay = previous.days[today] ?? emptyDay(today);
      const nextDay = { ...currentDay, practiceMinutes: currentDay.practiceMinutes + roundedMinutes };
      const nextDays = { ...previous.days, [today]: nextDay };
      return {
        ...previous,
        days: nextDays,
        streak: calculateStreak(nextDays),
        totalPracticeMinutes: previous.totalPracticeMinutes + roundedMinutes,
      };
    });
  }, []);

  const recordFlashcard = useCallback((score: number) => {
    setStats(previous => {
      const today = getDateKey();
      const currentDay = previous.days[today] ?? emptyDay(today);
      const nextDay = { ...currentDay, flashcardScore: Math.max(currentDay.flashcardScore, Math.round(score)) };
      const nextDays = { ...previous.days, [today]: nextDay };
      return { ...previous, days: nextDays, streak: calculateStreak(nextDays) };
    });
  }, []);

  const recordDialogue = useCallback(() => {
    setStats(previous => {
      const today = getDateKey();
      const currentDay = previous.days[today] ?? emptyDay(today);
      const nextDay = { ...currentDay, dialoguesPracticed: currentDay.dialoguesPracticed + 1 };
      const nextDays = { ...previous.days, [today]: nextDay };
      return { ...previous, days: nextDays, streak: calculateStreak(nextDays) };
    });
  }, []);

  const getTodayStats = useCallback((): DayStats => {
    const today = getDateKey();
    return stats.days[today] ?? emptyDay(today);
  }, [stats]);

  const getWeekStats = useCallback((): DayStats[] => {
    const result: DayStats[] = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = getDateKey(date);
      result.push(stats.days[key] ?? emptyDay(key));
    }
    return result;
  }, [stats]);

  return {
    stats,
    recordWordLearned,
    recordPractice,
    recordFlashcard,
    recordDialogue,
    getTodayStats,
    getWeekStats,
  };
}
