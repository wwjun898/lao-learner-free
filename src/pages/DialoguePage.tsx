import { useState } from 'react';
import { Mic, Volume2 } from '../components/IconGlyphs';
import { useReview } from '../hooks/useReview';
import { Star } from 'lucide-react';
import SpeechPractice from '../components/SpeechPractice';
import { dialogues } from '../data/dialogues';
import { useSpeech } from '../hooks/useSpeech';
import { useStats } from '../hooks/useStats';
import ExplainButton from '../components/ExplainButton';

interface Props { goBack: () => void }

export default function DialoguePage({ goBack }: Props) {
  const review = useReview();
  const [selected, setSelected] = useState<number | null>(null);
  const [category, setCategory] = useState('all');
  const [showPinyin, setShowPinyin] = useState(true);
  const [practiceLine, setPracticeLine] = useState<{ lao: string; chinese: string; pinyin: string } | null>(null);
  const [speakingLine, setSpeakingLine] = useState<string | null>(null);
  const { speakLao, isSpeaking } = useSpeech();
  const { recordPractice } = useStats();
  const filtered = category === 'all' ? dialogues : dialogues.filter(item => item.category === category);

  if (selected !== null) {
    const dialogue = dialogues[selected];
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><button onClick={() => setSelected(null)} className="text-3xl" aria-label="返回">‹</button><div className="min-w-0 flex-1"><h1 className="truncate text-lg font-semibold dark:text-white">{dialogue.title}</h1><p className="truncate text-xs text-gray-500">{dialogue.category} · {dialogue.scenario}</p></div><button onClick={() => setShowPinyin(v => !v)} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs text-amber-800">{showPinyin ? '隐藏拼音' : '显示拼音'}</button></header>
      <div className="space-y-3 px-4 py-4">{dialogue.lines.map((line, lineIndex) => { const key = `${selected}-${lineIndex}`; const learner = line.speaker === 'A'; const active = isSpeaking && speakingLine === key; return <div key={lineIndex} className={`flex ${learner ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[88%] rounded-2xl p-4 shadow-sm ${learner ? 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800' : 'bg-emerald-700 text-white'}`}><div className="mb-1 text-xs opacity-70">{learner ? '你' : '老挝人'}</div><div className="lao-text text-xl font-semibold">{line.lao}</div><div className="mt-1 text-sm">{line.chinese}</div>{showPinyin && <div className="mt-1 font-mono text-xs text-amber-600">{line.pinyin}</div>}<div className="mt-3 grid grid-cols-2 gap-2 [&>button]:h-10 [&>button]:w-full [&>button]:justify-center"><button onClick={() => { setSpeakingLine(key); speakLao(line.lao); }} aria-label="播放" className={`inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1.5 text-sm text-sky-700 ${active ? 'ring-2 ring-sky-300' : ''}`}><Volume2 size={15} />{active ? '播放中' : '听'}</button><button onClick={() => { recordPractice(1); setPracticeLine({ lao: line.lao, chinese: line.chinese, pinyin: line.pinyin }); }} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-sm text-emerald-700"><Mic size={15} />跟读</button><ExplainButton text={line.lao} category={dialogue.category} /><button onClick={() => review.toggle({ ...line, category: dialogue.category, source: 'dialogue' })} aria-label={review.has({ ...line, category: dialogue.category, source: 'dialogue' }) ? '移出翻卡复习' : '加入翻卡复习'} title="翻卡复习" className="inline-flex h-10 items-center justify-center gap-1 rounded-full bg-amber-50 text-sm text-amber-700"><Star size={18} fill={review.has({ ...line, category: dialogue.category, source: 'dialogue' }) ? 'currentColor' : 'none'} />翻卡</button></div></div></div>; })}</div>
      {practiceLine && <SpeechPractice targetText={practiceLine.lao} chineseText={practiceLine.chinese} pinyin={practiceLine.pinyin} onClose={() => setPracticeLine(null)} />}
    </div>;
  }

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"><header className="sticky top-0 z-10 border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><div className="flex items-center gap-3"><button onClick={goBack} className="text-3xl" aria-label="返回">‹</button><div><h1 className="text-lg font-semibold dark:text-white">实用对话</h1><p className="text-xs text-gray-400">{dialogues.length} 个主题 · 每个主题 50 句</p></div></div><select value={category} onChange={e => setCategory(e.target.value)} className="mt-3 h-10 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="all">全部主题</option>{dialogues.map(item => <option key={item.category} value={item.category}>{item.category}</option>)}</select></header><div className="grid grid-cols-2 gap-3 px-4 py-4">{filtered.map(item => <button key={item.category} onClick={() => setSelected(dialogues.indexOf(item))} className="min-h-36 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"><div className="mb-2 text-3xl">{item.icon}</div><h3 className="font-semibold dark:text-white">{item.title}</h3><p className="mt-1 text-xs text-emerald-700">{item.category}</p><p className="mt-1 text-xs text-gray-400">{item.lines.length} 句对话</p></button>)}</div></div>;
}
