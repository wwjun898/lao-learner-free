import { useState } from 'react';
import { ArrowLeft, Sparkles, Volume2, Settings } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useScenarioPhrases } from '../hooks/useScenarioPhrases';
import { useGeneratedScenes, type SavedScene } from '../hooks/useGeneratedScenes';
import { useSpeech } from '../hooks/useSpeech';
import { generateScene } from '../lib/ai';
import { parseChineseWords } from '../lib/sceneGeneration';
import SearchPage from './SearchPage';

export default function GenerateScenePage({ goBack, openScenarios }: { goBack: () => void; openScenarios: () => void }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SavedScene | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [settings, setSettings] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const { practiceCategories } = useCategories();
  const { customPhrases } = useScenarioPhrases();
  const { scenes, save, updateCategory } = useGeneratedScenes();
  const categories = [...new Set([...practiceCategories, ...customPhrases.map(item => item.category), ...scenes.map(item => item.category)])];
  const { speakLao, isSpeaking } = useSpeech();
  async function generate() {
    if (busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const words = parseChineseWords(input);
      const scene = await generateScene(words, categories);
      setResult(save(scene, words));
      setSelectedCategory(scene.category);
    } catch (failure) { setError(failure instanceof Error ? failure.message : '生成失败，请重试'); }
    finally { setBusy(false); }
  }
  function assignCategory() {
    if (!result || !categories.includes(selectedCategory)) return;
    try {
      setResult(updateCategory(result.id, selectedCategory));
      setError('');
      openScenarios();
    } catch (failure) { setError(failure instanceof Error ? failure.message : '归类失败，请重试'); }
  }
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <button aria-label="返回" onClick={goBack} className="shrink-0 p-2"><ArrowLeft size={20} /></button>
      <div className="min-w-0 flex-1"><h1 className="text-base font-semibold dark:text-white">自构中文词语，AI 造场景练习句</h1></div>
      <button aria-label="AI 设置" title="AI 设置" onClick={() => setSettings(true)} className="shrink-0 p-2"><Settings size={20} /></button>
    </header>
    <main className="space-y-4 px-4 py-5">
      <label className="block text-sm dark:text-white">中文词语（1–10 个）
        <textarea aria-label="中文词语" value={input} maxLength={500} onChange={event => setInput(event.target.value)} placeholder="例如：市场、香蕉、价格、便宜" rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800" />
      </label>
      <button disabled={busy || !input.trim()} onClick={generate} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 text-white disabled:opacity-50"><Sparkles size={18} />{busy ? '正在生成场景…' : '生成场景练习句'}</button>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && <section className="space-y-3">
        <h2 className="font-semibold dark:text-white">{result.title}</h2>
        <p role="status" className="text-sm text-green-700">已保存到场景练习 AI 生成 · {result.category}</p>
        {result.sentences.map((sentence, index) => <article key={index} className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-3"><div className="lao-text min-w-0 flex-1 break-words text-xl dark:text-white">{sentence.lao}</div>
            <button aria-label={`播放第${index + 1}句`} onClick={() => { setSpeakingIndex(index); speakLao(sentence.lao); }} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 ${isSpeaking && speakingIndex === index ? 'ring-2 ring-blue-300' : ''}`}><Volume2 size={18} /></button></div>
          <p className="mt-2 text-sm font-mono text-amber-600">{sentence.pinyin}</p><p className="mt-1 dark:text-gray-200">{sentence.chinese}</p>
        </article>)}
        <label className="block text-sm dark:text-white">归入分类
          <select aria-label="归入分类" value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <button onClick={assignCategory} className="min-h-11 w-full rounded-lg bg-green-600 px-3 text-white">归入场景练习AI生成</button>
      </section>}
    </main>
    {settings && <div role="dialog" aria-modal="true" aria-label="AI 设置" className="fixed inset-0 z-40 overflow-y-auto bg-white"><SearchPage goBack={() => setSettings(false)} settingsInitiallyOpen /></div>}
  </div>;
}
