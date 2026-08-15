import { useMemo, useState, type ReactNode } from 'react';
import { categories } from '../data/vocabulary';
import { useAnalysisLibrary } from '../hooks/useAnalysisLibrary';
import { useSpeech } from '../hooks/useSpeech';

interface Props {
  goBack: () => void;
}

export default function AnalysisLibraryPage({ goBack }: Props) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speakingLao, setSpeakingLao] = useState<string | null>(null);
  const { entries, updateCategory, removeEntry } = useAnalysisLibrary();
  const { speakLao, isSpeaking } = useSpeech();

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter(entry => {
      const matchesCategory = category === 'all' || entry.category === category;
      const matchesQuery = !normalizedQuery || [
        entry.analysis.normalizedLao,
        entry.analysis.chineseMeaning,
        entry.analysis.pinyin,
      ].some(value => value.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [category, entries, query]);

  const selectedEntry = entries.find(entry => entry.id === selectedId);

  if (selectedEntry) {
    const analysis = selectedEntry.analysis;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onBack={() => setSelectedId(null)} title="解析详情" subtitle={selectedEntry.category} />

        <main className="pb-8">
          <section className="bg-white dark:bg-gray-800 px-5 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="lao-text text-3xl font-bold text-gray-900 dark:text-white break-words">{analysis.normalizedLao}</div>
                <div className="mt-1 font-mono text-sm text-amber-600 dark:text-amber-400">{analysis.pinyin}</div>
                <div className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{analysis.chineseMeaning}</div>
              </div>
              <button
                onClick={() => {
                  setSpeakingLao(analysis.normalizedLao);
                  speakLao(analysis.normalizedLao);
                }}
                disabled={isSpeaking && speakingLao === analysis.normalizedLao}
                className="w-11 h-11 shrink-0 rounded-full bg-sky-100 text-sky-700 disabled:opacity-50"
                aria-label="播放发音"
              >🔊</button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={selectedEntry.category}
                onChange={event => updateCategory(selectedEntry.id, event.target.value)}
                className="h-10 flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-800 dark:text-white"
                aria-label="解析分类"
              >
                {categories.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{analysis.contentType === 'phrase' ? '短语/短句' : analysis.partOfSpeech}</span>
            </div>
          </section>

          <LibrarySection title="中文意思">
            <ol className="space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
              {analysis.detailedMeanings.map((meaning, index) => <li key={index}>{index + 1}. {meaning}</li>)}
            </ol>
          </LibrarySection>
          <LibrarySection title="构词方式分析">
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">{analysis.wordFormation}</p>
          </LibrarySection>
          <LibrarySection title="用法提示">
            <ul className="space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
              {analysis.usageNotes.map((note, index) => <li key={index}>• {note}</li>)}
            </ul>
          </LibrarySection>
          <LibrarySection title="常用例句">
            <div className="space-y-4">
              {analysis.examples.map((example, index) => (
                <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="lao-text text-xl font-semibold text-gray-900 dark:text-white">{example.lao}</div>
                  <div className="mt-1 font-mono text-xs text-amber-600 dark:text-amber-400">{example.pinyin}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{example.chinese}</div>
                </div>
              ))}
            </div>
          </LibrarySection>

          <div className="px-5 pt-5">
            <button
              onClick={() => {
                if (!confirm('确定删除这条解析记录？')) return;
                removeEntry(selectedEntry.id);
                setSelectedId(null);
              }}
              className="w-full h-11 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-600 dark:text-red-300"
            >
              删除解析记录
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Header onBack={goBack} title="AI 解析库" subtitle={`${entries.length} 条完整解析`} />
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2 px-4 pb-3">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="搜索老挝文、中文或转写"
            className="min-w-0 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-900 dark:text-white"
          />
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="min-w-0 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-900 dark:text-white"
            aria-label="解析库分类"
          >
            <option value="all">全部分类</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <main className="px-4 py-4 space-y-5">
        {categories.map(categoryName => {
          const categoryEntries = filteredEntries.filter(entry => entry.category === categoryName);
          if (categoryEntries.length === 0) return null;
          return (
            <section key={categoryName}>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{categoryName}</h2>
                <span className="text-xs text-gray-400">{categoryEntries.length} 条</span>
              </div>
              <div className="space-y-2">
                {categoryEntries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    className="w-full rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left shadow-sm hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="lao-text text-2xl font-semibold text-gray-900 dark:text-white break-words">{entry.analysis.normalizedLao}</div>
                        <div className="mt-1 text-gray-700 dark:text-gray-300">{entry.analysis.chineseMeaning}</div>
                        <div className="mt-1 font-mono text-xs text-amber-600 dark:text-amber-400">{entry.analysis.pinyin}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-300">{entry.analysis.contentType === 'phrase' ? '短句' : '词语'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {filteredEntries.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无匹配的解析记录</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Header({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle?: string }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="返回">
        <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function LibrarySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-800 px-5 py-5 border-b border-gray-100 dark:border-gray-700">
      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}
