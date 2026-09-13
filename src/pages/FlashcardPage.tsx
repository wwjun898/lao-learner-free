import { useState } from 'react';
import { useReview, type ReviewCard, type ReviewSource } from '../hooks/useReview';
import { useCategories } from '../hooks/useCategories';
import { dialogues } from '../data/dialogues';
import { useSpeech } from '../hooks/useSpeech';
import { useStats } from '../hooks/useStats';

interface Props {
  goBack: () => void;
}

type ReviewMode = 'all' | 'priority';

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createDeck(priorityWords: ReviewCard[]) {
  // 翻卡复习只使用用户主动加入重点复习的内容，不再预置词汇。
  return shuffled(priorityWords).slice(0, 20);
}

export default function FlashcardPage({ goBack }: Props) {
  const { cards: allPriorityCards, remove } = useReview();
  const { vocabularyCategories, practiceCategories } = useCategories();
  const [categoryKey, setCategoryKey] = useState('all');
  const groups: { source: ReviewSource; label: string; categories: string[] }[] = [
    { source: 'vocabulary', label: '主题词汇', categories: vocabularyCategories },
    { source: 'dialogue', label: '实用对话', categories: dialogues.map(item => item.category) },
    { source: 'analysis', label: 'AI 解析库', categories: [] },
    { source: 'scenario', label: '场景练习', categories: practiceCategories },
  ];
  const filteredCards = (filter: string) => allPriorityCards.filter(card =>
    filter === 'all' || JSON.stringify([card.source, card.category]) === filter);
  const categoryControl = <label className="block bg-white px-4 pb-3 text-sm dark:bg-gray-800 dark:text-white">
    <span className="mb-1 block text-gray-500">复习分类</span>
    <select aria-label="复习分类" value={categoryKey} onChange={event => {
      setCategoryKey(event.target.value); resetDeck(event.target.value);
    }} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-600 dark:bg-gray-700">
      <option value="all">全部分类 ({allPriorityCards.length})</option>
      {groups.map(group => <optgroup key={group.source} label={group.label}>
        {[...new Set([...group.categories, ...allPriorityCards.filter(card => card.source === group.source).map(card => card.category)])].map(category => {
          const value = JSON.stringify([group.source, category]);
          return <option key={value} value={value}>{category} ({filteredCards(value).length})</option>;
        })}
      </optgroup>)}
    </select>
  </label>;
  const { speakLao, isSpeaking } = useSpeech();
  const { recordFlashcard, recordPractice, recordWordLearned } = useStats();
  const [mode, setMode] = useState<ReviewMode>('all');
  const [cards, setCards] = useState<ReviewCard[]>(() => createDeck(allPriorityCards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<boolean[]>(() => new Array(Math.min(20, allPriorityCards.length)).fill(false));
  const [showResult, setShowResult] = useState(false);

  function resetDeck(filter = categoryKey) {
    const nextCards = createDeck(filteredCards(filter));
    setCards(nextCards);
    setKnown(new Array(nextCards.length).fill(false));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResult(false);
  }

  function changeMode(nextMode: ReviewMode) {
    setMode(nextMode);
    resetDeck();
  }

  function markCurrent(recognized: boolean) {
    const nextKnown = [...known];
    nextKnown[currentIndex] = recognized;
    setKnown(nextKnown);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(index => index + 1);
      setIsFlipped(false);
    } else {
      const knownCount = nextKnown.filter(Boolean).length;
      recordFlashcard((knownCount / cards.length) * 100);
      recordPractice(Math.max(1, Math.ceil(cards.length / 10)));
      setShowResult(true);
    }
  }

  function removeCurrent() {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    remove(currentCard);

    const nextCards = cards.filter((_, index) => index !== currentIndex);
    const nextKnown = known.filter((_, index) => index !== currentIndex);
    setCards(nextCards);
    setKnown(nextKnown);
    setIsFlipped(false);
    setCurrentIndex(index => Math.min(index, Math.max(0, nextCards.length - 1)));
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header goBack={goBack} title="翻卡复习" />
        {categoryControl}
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-gray-500 mb-4">此分类暂无重点词句</p>
          <button onClick={goBack} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white">返回主界面</button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const knownCount = known.filter(Boolean).length;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header goBack={goBack} title="复习结果" />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-6xl mb-4">{knownCount >= cards.length * 0.8 ? '🎉' : knownCount >= cards.length * 0.5 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold mb-2">本轮完成</h2>
          <p className="text-gray-600 mb-6">掌握 {knownCount}/{cards.length} 个词汇</p>
          <div className="w-full max-w-sm space-y-3">
            <button onClick={() => resetDeck()} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">再来一轮</button>
            <button onClick={goBack} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold">返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header goBack={goBack} title="翻卡复习" subtitle={`${currentIndex + 1} / ${cards.length}`} />

      {categoryControl}
      {allPriorityCards.length > 0 && (
        <div className="bg-white px-4 pb-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
            <button onClick={() => changeMode('all')} className={`h-9 rounded-md text-sm ${mode === 'all' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}>全部</button>
            <button onClick={() => changeMode('priority')} className={`h-9 rounded-md text-sm ${mode === 'priority' ? 'bg-white shadow-sm font-semibold text-red-600' : 'text-gray-500'}`}>重点 ({allPriorityCards.length})</button>
          </div>
        </div>
      )}

      <div className="bg-white px-4 pb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <button
          onClick={() => setIsFlipped(value => !value)}
          className="w-full max-w-sm min-h-64 bg-white rounded-2xl shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center p-6 active:scale-[0.98]"
        >
          {!isFlipped ? (
            <>
              <div className="text-sm text-gray-400 mb-4">点击翻转</div>
              <div className="lao-text text-3xl font-bold text-gray-800 mb-2 break-words">{current.lao}</div>
              <div className="text-sm text-amber-600 font-mono">{current.pinyin}</div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-400 mb-4">中文释义</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{current.chinese}</div>
              <div className="text-sm text-gray-500">{current.category}</div>
            </>
          )}
        </button>

        <button
          onClick={() => {
            recordWordLearned(current.lao);
            speakLao(current.lao);
          }}
          disabled={isSpeaking}
          className="mt-4 w-11 h-11 rounded-full bg-blue-100 text-blue-600"
          aria-label="播放发音"
        >🔊</button>

        {isFlipped && (
          <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-sm">
            <button onClick={() => markCurrent(false)} className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-semibold border-2 border-red-200">不会</button>
            <button onClick={() => markCurrent(true)} className="flex-1 py-4 bg-green-50 text-green-600 rounded-xl font-semibold border-2 border-green-200">认识</button>
            <button onClick={removeCurrent} className="flex-1 py-4 bg-amber-50 text-amber-700 rounded-xl font-semibold border-2 border-amber-200">移出翻卡</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ goBack, title, subtitle }: { goBack: () => void; title: string; subtitle?: string }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="返回">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
