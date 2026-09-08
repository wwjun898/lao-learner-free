import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCategories, type SaveDestination } from '../hooks/useCategories';
import { useFavorites } from '../hooks/useFavorites';
import { useSpeech } from '../hooks/useSpeech';
import { useVocabulary } from '../hooks/useVocabulary';
import { useScenarioPhrases } from '../hooks/useScenarioPhrases';
import { useStats } from '../hooks/useStats';
import { useAnalysisLibrary } from '../hooks/useAnalysisLibrary';
import { analyzeLao, clearAiConfig, getAiConfig, saveAiConfig } from '../lib/ai';
import { normalizeAnalysisRomanization } from '../lib/romanization';
import type { AiConfigStatus, AnalysisResponse } from '../types/ai';

interface Props {
  goBack: () => void;
}

const emptyConfig: AiConfigStatus = {
  mode: 'google',
  configured: false,
  apiBase: 'https://generativelanguage.googleapis.com',
};

export default function SearchPage({ goBack }: Props) {
  const [query, setQuery] = useState('');
  const [config, setConfig] = useState<AiConfigStatus>(emptyConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('社交礼貌');
  const [destination, setDestination] = useState<SaveDestination>('vocabulary');
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const { vocabularyCategories, practiceCategories, addCategory } = useCategories();
  const [priority, setPriority] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [speakingLao, setSpeakingLao] = useState<string | null>(null);
  const { speakLao, isSpeaking } = useSpeech();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { vocabulary, customWords, saveCustomWord } = useVocabulary();
  const { customPhrases, saveCustomPhrase } = useScenarioPhrases();
  const { recordWordLearned } = useStats();
  const { saveEntry: saveLibraryEntry } = useAnalysisLibrary();
  const availableCategories = [...new Set(destination === 'vocabulary'
    ? [...vocabularyCategories, ...vocabulary.map(item => item.category)]
    : [...practiceCategories, ...customPhrases.map(item => item.category)])];

  function changeDestination(next: SaveDestination) {
    setDestination(next);
    setSelectedCategory(next === 'vocabulary' ? vocabularyCategories[0] : practiceCategories[0]);
    setSavedMessage('');
    setAddingCategory(false);
    setCategoryError('');
  }

  function createCategory() {
    try {
      setSelectedCategory(addCategory(destination, newCategory));
      setNewCategory('');
      setAddingCategory(false);
      setCategoryError('');
      setSavedMessage('');
    } catch (error) { setCategoryError(error instanceof Error ? error.message : '分类保存失败'); }
  }

  useEffect(() => {
    getAiConfig()
      .then(status => {
        setConfig(status);
      })
      .catch(() => setAnalysisError('本地 AI 服务未启动，请使用 start-local.bat 启动应用'));
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const searchableItems = [
      ...vocabulary,
      ...customPhrases.map(item => ({ ...item, level: 1 })),
    ];
    return searchableItems.filter(item =>
      item.lao.includes(normalized)
      || item.chinese.includes(normalized)
      || item.pinyin.toLowerCase().includes(normalized)
      || item.category.includes(normalized),
    ).slice(0, 20);
  }, [customPhrases, query, vocabulary]);

  const hasConfiguredProvider = config.configured;

  async function handleAnalyze() {
    if (!query.trim()) return;
    if (!hasConfiguredProvider) {
      setShowSettings(true);
      return;
    }
    setAnalysisBusy(true);
    setAnalysisError('');
    setSavedMessage('');
    try {
      const response = await analyzeLao(query.trim());
      const normalizedResponse = { ...response, analysis: normalizeAnalysisRomanization(response.analysis) };
      setAnalysisResult(normalizedResponse);
      // Keep the user's destination and category across analyses.
      saveLibraryEntry(normalizedResponse);
      const saved = destination === 'scenario'
        ? customPhrases.find(item => item.lao === normalizedResponse.analysis.normalizedLao)
        : customWords.find(item => item.lao === normalizedResponse.analysis.normalizedLao);
      setPriority(saved?.priority ?? false);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : '解析失败，请稍后重试');
    } finally {
      setAnalysisBusy(false);
    }
  }

  async function handleSaveSettings() {
    setSettingsBusy(true);
    setAnalysisError('');
    try {
      const status = await saveAiConfig({
        mode: config.mode,
        ...(apiKey.trim() && { apiKey: apiKey.trim() }),
      });
      setConfig(status);
      setApiKey('');
      setShowSettings(false);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : '配置保存失败');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleClearSettings() {
    if (!confirm('确定清除本机保存的所有 AI 密钥？')) return;
    setSettingsBusy(true);
    try {
      const status = await clearAiConfig();
      setConfig(status);
      setApiKey('');
    } finally {
      setSettingsBusy(false);
    }
  }

  function saveAnalysis() {
    if (!analysisResult) return;
    const analysis = analysisResult.analysis;
    saveLibraryEntry(analysisResult, selectedCategory);
    const shared = {
      lao: analysis.normalizedLao,
      chinese: analysis.chineseMeaning,
      pinyin: analysis.pinyin,
      category: selectedCategory,
      priority,
      createdAt: new Date().toISOString(),
    };
    if (destination === 'scenario') {
      saveCustomPhrase(shared);
      setSavedMessage(priority ? '已保存到场景练习，并加入重点复习' : '已保存到场景练习');
      return;
    }
    saveCustomWord({ ...shared, level: 1, analysis });
    recordWordLearned(analysis.normalizedLao);
    setSavedMessage(priority ? '已保存到主题词汇和重点复习' : '已保存到主题词汇');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="返回">
            <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold dark:text-white">搜索与 AI 解析</h1>
            <p className="text-[11px] text-gray-400">本地词库 · Google Gemini</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            aria-label="AI 设置"
            title="AI 设置"
          >
            ⚙️
          </button>
        </div>

        <div className="px-4 pb-3">
          <textarea
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setSavedMessage('');
            }}
            placeholder="粘贴老挝语词语或短句"
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 lao-text text-base leading-7 dark:text-white placeholder:text-sm placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!query.trim() || analysisBusy}
              className="flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {analysisBusy ? '正在解析...' : '✨ AI 深度解析'}
            </button>
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setAnalysisResult(null);
                  setAnalysisError('');
                }}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"
                aria-label="清空"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 py-4 space-y-5">
        {analysisError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {analysisError}
          </div>
        )}

        {analysisResult && (
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="lao-text text-3xl font-bold text-gray-900 dark:text-white break-words">
                    {analysisResult.analysis.normalizedLao}
                  </div>
                  <div className="mt-1 text-sm font-mono text-amber-600">{analysisResult.analysis.pinyin}</div>
                  <div className="mt-2 text-lg font-semibold text-gray-800 dark:text-white">
                    {analysisResult.analysis.chineseMeaning}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (analysisResult.analysis.contentType === 'word') {
                      recordWordLearned(analysisResult.analysis.normalizedLao);
                    }
                    setSpeakingLao(analysisResult.analysis.normalizedLao);
                    speakLao(analysisResult.analysis.normalizedLao);
                  }}
                  disabled={isSpeaking && speakingLao === analysisResult.analysis.normalizedLao}
                  className="w-10 h-10 shrink-0 rounded-full bg-blue-100 text-blue-600"
                  aria-label="播放发音"
                >
                  🔊
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-gray-600 dark:text-gray-300">
                  {analysisResult.analysis.partOfSpeech}
                </span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                  {destination === 'scenario' ? '将收录到场景练习' : '将收录到主题词汇'}
                </span>
                <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-blue-600 dark:text-blue-300">
                  Google · Gemini 3.5 Flash
                </span>
                <span className="rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-amber-700 dark:text-amber-300">
                  已保存到解析库
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <AnalysisSection title="中文意思">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {analysisResult.analysis.detailedMeanings.map((meaning, index) => (
                    <li key={index} className="flex gap-2"><span className="text-blue-500">{index + 1}.</span><span>{meaning}</span></li>
                  ))}
                </ul>
              </AnalysisSection>

              <AnalysisSection title="构词方式分析">
                <p className="text-sm leading-7 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {analysisResult.analysis.wordFormation}
                </p>
              </AnalysisSection>

              <AnalysisSection title="用法提示">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {analysisResult.analysis.usageNotes.map((note, index) => (
                    <li key={index} className="flex gap-2"><span className="text-amber-500">•</span><span>{note}</span></li>
                  ))}
                </ul>
              </AnalysisSection>

              <AnalysisSection title="常用例句">
                <div className="space-y-4">
                  {analysisResult.analysis.examples.map((example, index) => (
                    <div key={index}>
                      <div className="lao-text text-xl font-semibold text-gray-900 dark:text-white">{example.lao}</div>
                      <div className="text-xs font-mono text-amber-600 mt-1">{example.pinyin}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{example.chinese}</div>
                    </div>
                  ))}
                </div>
              </AnalysisSection>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 px-4 py-4 space-y-3">
              <fieldset>
                <legend className="mb-2 text-sm text-gray-700 dark:text-gray-200">保存位置</legend>
                <div className="grid grid-cols-2 gap-3">
                  {([['vocabulary', '主题词汇'], ['scenario', '场景练习']] as const).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm dark:text-white">
                      <input type="radio" name="save-destination" checked={destination === value} onChange={() => changeDestination(value)} />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="block text-xs text-gray-500 mb-1.5">保存到分类</span>
                <select
                  value={selectedCategory}
                  onChange={event => {
                    const category = event.target.value;
                    setSelectedCategory(category);
                    setSavedMessage('');
                  }}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm dark:text-white"
                >
                  {availableCategories
                    .map(category => <option key={category}>{category}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => { setAddingCategory(value => !value); setCategoryError(''); }} className="text-sm text-blue-700 dark:text-blue-300">新增分类</button>
              {addingCategory && <div className="flex flex-wrap gap-2">
                <input aria-label="新分类名称" value={newCategory} maxLength={40} onChange={event => setNewCategory(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) createCategory(); }} className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-gray-900" />
                <button type="button" onClick={createCategory} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">添加</button>
              </div>}
              {categoryError && <p role="alert" className="text-sm text-red-600">{categoryError}</p>}
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={priority}
                  onChange={event => setPriority(event.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                加入重点反复记忆
              </label>
              <button onClick={saveAnalysis} className="w-full h-11 rounded-lg bg-green-600 text-white font-semibold">
                {destination === 'scenario' ? '保存到场景练习' : '保存到主题词汇'}
              </button>
              {savedMessage && <p className="text-center text-sm text-green-600">{savedMessage}</p>}
            </div>
          </section>
        )}

        {query.trim() && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">本地词库</h2>
              <span className="text-xs text-gray-400">{results.length} 个匹配</span>
            </div>
            {results.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">本地暂无匹配，可使用 AI 解析后收录</div>
            ) : (
              <div className="space-y-2">
                {results.map(item => (
                  <div key={`${item.category}-${item.lao}`} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="lao-text text-2xl font-semibold text-gray-800 dark:text-white break-words">{item.lao}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">{item.category}</span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mt-1">{item.chinese}</div>
                        <div className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-mono">{item.pinyin}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            recordWordLearned(item.lao);
                            setSpeakingLao(item.lao);
                            speakLao(item.lao);
                          }}
                          disabled={isSpeaking && speakingLao === item.lao}
                          className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full"
                        >🔊</button>
                        <button onClick={() => toggleFavorite(item.lao)} className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {isFavorite(item.lao) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!query.trim() && !analysisResult && (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-gray-600 dark:text-gray-300">粘贴老挝语后可搜索或深度解析</p>
          </div>
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">AI 模型设置</h2>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700" aria-label="关闭">×</button>
            </div>

            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold dark:text-white">
                  Google Gemini API Key
                </legend>
                <input
                  type="password"
                  name={`ai-provider-key-${config.mode}`}
                  value={apiKey}
                  onChange={event => setApiKey(event.target.value)}
                  placeholder={config.configured ? '已配置，留空保持不变' : '输入 API Key'}
                  autoComplete="new-password"
                  data-form-type="other"
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm dark:text-white"
                />
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-300 break-all">
                  API 地址：{config.apiBase}
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600"
                >
                  获取 Google Gemini API Key
                </a>
              </fieldset>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                使用 Google Gemini 解析。密钥只保存在本机，不会写入 APK。
                <div className="mt-1">
                  请在 AI Studio 的 API Keys 页面创建 Gemini API Key，不要粘贴项目编号或 OAuth 密钥。
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={settingsBusy} className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50">
                {settingsBusy ? '保存中...' : '保存设置'}
              </button>
              {config.configured && (
                <button onClick={handleClearSettings} disabled={settingsBusy} className="w-full h-10 text-sm text-red-500">清除已保存密钥</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-4 py-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </section>
  );
}
