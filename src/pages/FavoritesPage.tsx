import { useSpeech } from '../hooks/useSpeech';
import { useFavorites } from '../hooks/useFavorites';
import { useVocabulary } from '../hooks/useVocabulary';
import { useStats } from '../hooks/useStats';

interface Props {
  goBack: () => void;
}

export default function FavoritesPage({ goBack }: Props) {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { speakLao, isSpeaking } = useSpeech();
  const { vocabulary, priorityWords, isPriority, togglePriority } = useVocabulary();
  const { recordWordLearned } = useStats();

  const favoriteWords = vocabulary.filter((v, index, all) => favorites.words.includes(v.lao)
    && all.findIndex(other => other.lao === v.lao) === index);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold dark:text-white flex-1">收藏与重点</h1>
        {favoriteWords.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定清空所有收藏？')) clearFavorites();
            }}
            className="text-sm text-red-500 hover:text-red-600"
          >
            清空
          </button>
        )}
      </div>

      <div className="px-4 py-4">
        {priorityWords.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-red-600">重点复习</h2>
              <span className="text-xs text-gray-400">{priorityWords.length} 个</span>
            </div>
            <div className="space-y-2">
              {priorityWords.map(item => (
                <div key={`priority-${item.lao}`} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="lao-text text-2xl font-semibold text-gray-800 dark:text-white">{item.lao}</div>
                      <div className="text-gray-700 dark:text-gray-300 mt-1">{item.chinese}</div>
                      <div className="text-sm text-amber-600 mt-1 font-mono">{item.pinyin}</div>
                    </div>
                    <button onClick={() => togglePriority(item.lao)} className="w-9 h-9 rounded-full bg-red-100 text-red-500" aria-label="取消重点">★</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {favoriteWords.length === 0 && priorityWords.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📌</div>
            <h2 className="text-xl font-semibold dark:text-white mb-2">还没有收藏或重点词</h2>
            <p className="text-gray-500 dark:text-gray-400">搜索并解析词汇后可加入重点复习</p>
          </div>
        ) : favoriteWords.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">其他收藏 {favoriteWords.length} 个</p>
            {favoriteWords.map((item, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="lao-text text-2xl font-semibold text-gray-800 dark:text-white">{item.lao}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                        {item.category}
                      </span>
                      {isPriority(item.lao) && <span className="text-xs text-red-500">重点</span>}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mt-1">{item.chinese}</div>
                    <div className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-mono">{item.pinyin}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        recordWordLearned(item.lao);
                        speakLao(item.lao);
                      }}
                      disabled={isSpeaking}
                      className="w-9 h-9 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center"
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.lao)}
                      className="w-9 h-9 bg-red-100 text-red-500 rounded-full flex items-center justify-center"
                    >
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
