import { useEffect, useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Heart, Mic, Volume2 } from '../components/IconGlyphs';
import SpeechPractice from '../components/SpeechPractice';
import { topicPractices } from '../data/topicPractice';
import { useFavorites } from '../hooks/useFavorites';
import { useScenarioPhrases } from '../hooks/useScenarioPhrases';
import { useSpeech } from '../hooks/useSpeech';
import { useStats } from '../hooks/useStats';

interface Props { goBack: () => void }
interface Phrase { lao: string; chinese: string; pinyin: string; custom?: boolean }
interface Scenario { category: string; icon: string; title: string; phrases: Phrase[] }

export default function ScenarioPage({ goBack }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [practicePhrase, setPracticePhrase] = useState<Phrase | null>(null);
  const [speakingPhrase, setSpeakingPhrase] = useState<string | null>(null);
  const { speakLao, isSpeaking } = useSpeech();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { customPhrases } = useScenarioPhrases();
  const { recordPractice } = useStats();
  useEffect(() => { if (!isSpeaking) setSpeakingPhrase(null); }, [isSpeaking]);
  const { practiceCategories } = useCategories();
  const scenarios: Scenario[] = [...new Set([...practiceCategories, ...customPhrases.map(item => item.category)])].map(category => {
    const topic = topicPractices.find(item => item.category === category);
    return { category, icon: topic?.icon ?? '🧰', title: topic?.title ?? category,
      phrases: [...(topic?.lines ?? []).map(({ lao, chinese, pinyin }) => ({ lao, chinese, pinyin })),
        ...customPhrases.filter(item => item.category === category).map(item => ({ ...item, custom: true }))] };
  });
  const filtered = categoryFilter === 'all' ? scenarios : scenarios.filter(item => item.category === categoryFilter);
  const selected = scenarios.find(item => item.category === selectedCategory);
  if (selected) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"><header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><button onClick={() => setSelectedCategory(null)} className="text-3xl" aria-label="返回">‹</button><div><h1 className="text-lg font-semibold dark:text-white">{selected.icon} {selected.title}</h1><p className="text-xs text-gray-400">{selected.category} · {selected.phrases.length} 条练习</p></div></header><div className="space-y-2 px-4 py-4">{selected.phrases.map((phrase, index) => { const key = `${selected.category}-${index}`; const active = isSpeaking && speakingPhrase === key; return <div key={`${phrase.lao}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="lao-text break-words text-xl font-semibold dark:text-white">{phrase.lao}</div>{phrase.custom && <span className="text-xs text-emerald-600">我的短语</span>}<div className="mt-1 text-gray-600 dark:text-gray-300">{phrase.chinese}</div><div className="mt-1 font-mono text-sm text-amber-600">{phrase.pinyin}</div></div><div className="flex shrink-0 gap-1.5"><button onClick={() => { setSpeakingPhrase(key); speakLao(phrase.lao); }} aria-label="播放" className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 ${active ? 'ring-2 ring-sky-300' : ''}`}><Volume2 size={18} /></button><button onClick={() => { recordPractice(1); setPracticePhrase(phrase); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700" aria-label="跟读"><Mic size={18} /></button><button onClick={() => toggleFavorite(phrase.lao)} className="inline-flex h-9 w-9 items-center justify-center rounded-full leading-none" aria-label="收藏"><Heart size={18} fill={isFavorite(phrase.lao) ? 'currentColor' : 'none'} className={isFavorite(phrase.lao) ? 'text-red-500' : 'text-gray-400'} /></button></div></div>{active && <div className="mt-2 text-right text-xs text-sky-600">播放中</div>}</div>; })}</div>{practicePhrase && <SpeechPractice targetText={practicePhrase.lao} chineseText={practicePhrase.chinese} pinyin={practicePhrase.pinyin} onClose={() => setPracticePhrase(null)} />}</div>;
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"><header className="sticky top-0 z-10 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><div className="flex items-center gap-3"><button onClick={goBack} className="text-3xl" aria-label="返回">‹</button><div><h1 className="text-lg font-semibold dark:text-white">场景练习</h1><p className="text-xs text-gray-400">{scenarios.length} 个主题 · 可持续添加行业短语</p></div></div><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-3 h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="all">全部主题</option>{scenarios.map(item => <option key={item.category} value={item.category}>{item.category}</option>)}</select></header><div className="grid grid-cols-2 gap-3 px-4 py-4">{filtered.map(item => <button key={item.category} onClick={() => setSelectedCategory(item.category)} className="min-h-36 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="mb-2 text-3xl">{item.icon}</div><h3 className="font-semibold dark:text-white">{item.title}</h3><p className="mt-1 text-xs text-emerald-700">{item.category}</p><p className="mt-1 text-xs text-gray-400">{item.phrases.length} 条练习</p></button>)}</div></div>;
}
