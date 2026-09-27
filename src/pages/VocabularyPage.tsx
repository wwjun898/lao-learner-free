import { useState } from 'react';
import { Mic, Star, Volume2 } from '../components/IconGlyphs';
import { useCategories } from '../hooks/useCategories';
import { useSpeech } from '../hooks/useSpeech';
import { useVocabulary } from '../hooks/useVocabulary';
import { useStats } from '../hooks/useStats';
import { useReview } from '../hooks/useReview';
import SpeechPractice from '../components/SpeechPractice';
import ExplainButton from '../components/ExplainButton';

interface Props {
  goBack: () => void;
}

export default function VocabularyPage({ goBack }: Props) {
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [practiceIndex, setPracticeIndex] = useState<number | null>(null);
  const [speakingLao, setSpeakingLao] = useState<string | null>(null);
  const { speakLao, isSpeaking } = useSpeech();
  const { vocabulary, moveToCategory } = useVocabulary();
  const review = useReview();
  const { vocabularyCategories } = useCategories();
  const categories = [...new Set([...vocabularyCategories, ...vocabulary.map(item => item.category)])];
  const { recordWordLearned, recordPractice } = useStats();

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = vocabulary.filter(item => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesQuery = !normalizedQuery || [item.lao, item.chinese, item.pinyin]
      .some(value => value.toLowerCase().includes(normalizedQuery));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold flex-1 dark:text-white">实用词汇</h1>
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              showPinyin ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showPinyin ? '隐藏转写' : '显示转写'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <label className="relative min-w-0">
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索中文、老挝文或转写"
              className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:bg-gray-700"
            />
          </label>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            aria-label="词汇分类"
            className="min-w-0 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white" value="all">全部分类</option>
            {categories.map(cat => <option className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white" key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center justify-between px-1 pb-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{category === 'all' ? '全部词汇' : category}</span>
          <span>{filtered.length} 个</span>
        </div>
        {filtered.map((item, i) => (
          <div key={`${item.category}-${item.lao}`} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-baseline gap-2">
                <span className="lao-text text-2xl font-semibold text-gray-800 dark:text-white break-words">{item.lao}</span>
                {review.has({ ...item, source: 'vocabulary' }) && <span className="shrink-0 text-xs text-amber-600">重点</span>}
              </div>
              <select
                value={item.category}
                onChange={event => {
                  const card = { ...item, source: 'vocabulary' as const };
                  if (review.has(card)) { review.remove(card); review.add({ ...card, category: event.target.value }); }
                  moveToCategory(item.lao, event.target.value);
                }}
                onClick={event => event.stopPropagation()}
                aria-label={`调整 ${item.lao} 分类`}
                title="移动到指定分类"
                className="w-28 h-9 shrink-0 rounded-lg border-0 bg-blue-50 px-2 text-xs text-blue-700 outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{item.chinese}</div>
            {showPinyin && <div className="mt-1 text-sm font-mono text-amber-600">{item.pinyin}</div>}

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <ExplainButton text={item.lao} category={item.category} />
                {/* 听发音按钮 */}
                <button
                  onClick={() => {
                    recordWordLearned(item.lao);
                    setSpeakingLao(item.lao);
                    speakLao(item.lao);
                  }}
                  disabled={isSpeaking && speakingLao === item.lao}
                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center 
                             hover:bg-blue-200 transition-colors disabled:opacity-50"
                  title="听发音"
                >
                  <Volume2 size={20} strokeWidth={2.2} />
                </button>
                
                {/* 跟读练习按钮 */}
                <button
                  onClick={() => {
                    recordWordLearned(item.lao);
                    recordPractice(1);
                    setPracticeIndex(i);
                  }}
                  className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center 
                             hover:bg-green-200 transition-colors"
                  title="跟读练习"
                >
                  <Mic size={20} strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => review.toggle({ ...item, source: 'vocabulary' })}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    review.has({ ...item, source: 'vocabulary' })
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  title={review.has({ ...item, source: 'vocabulary' }) ? '移出翻卡复习' : '加入翻卡复习'}
                  aria-label={review.has({ ...item, source: 'vocabulary' }) ? '移出翻卡复习' : '加入翻卡复习'}
                >
                  <Star size={20} strokeWidth={2.2} fill={review.has({ ...item, source: 'vocabulary' }) ? 'currentColor' : 'none'} />
                </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">没有找到匹配的词汇</div>
        )}
      </div>

      {/* Speech Practice Modal */}
      {practiceIndex !== null && filtered[practiceIndex] && (
        <SpeechPractice
          targetText={filtered[practiceIndex].lao}
          chineseText={filtered[practiceIndex].chinese}
          pinyin={filtered[practiceIndex].pinyin}
          onClose={() => setPracticeIndex(null)}
        />
      )}
    </div>
  );
}
