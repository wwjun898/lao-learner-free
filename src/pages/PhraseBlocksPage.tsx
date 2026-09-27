import { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import phraseBlocks from '../data/phraseBlocks.json';
import { useSpeech } from '../hooks/useSpeech';

const categoryNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

export default function PhraseBlocksPage({ goBack }: { goBack: () => void }) {
  const [category, setCategory] = useState(phraseBlocks[0]?.title ?? '');
  const [query, setQuery] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [active, setActive] = useState('');
  const { speakLao, stopSpeaking, isSpeaking } = useSpeech();
  const groups = phraseBlocks.filter(group => !category || group.title === category).map(group => ({
    ...group,
    items: group.items.filter(item => item.id <= 20).filter(item => [item.lao, item.pinyin, item.chinese, ...item.examples.flatMap(example => [example.lao, example.pinyin, example.chinese])].some(text => text.toLowerCase().includes(query.trim().toLowerCase()))),
  })).filter(group => group.items.length);

  function audioButton(id: string, text: string) {
    const playing = isSpeaking && active === id;
    return <button type="button" aria-label={`播放 ${text}`} aria-pressed={playing} title={playing ? '停止播放' : '播放'}
      onClick={() => {
        if (playing) { stopSpeaking(); setActive(''); return; }
        setActive(id);
        speakLao(text.replace(/\.{2,}|…|\//g, ' ').trim());
      }}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 ${playing ? 'ring-2 ring-blue-400' : ''}`}>
      <Volume2 size={19} />
    </button>;
  }

  return <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <button aria-label="返回主界面" title="返回" onClick={() => { stopSpeaking(); goBack(); }} className="flex h-9 w-9 shrink-0 items-center justify-center"><ArrowLeft size={22} /></button>
        <div className="min-w-0 flex-1"><h1 className="text-lg font-bold">常用语块</h1><p className="text-xs text-gray-500">免费展示前 20 条语块</p></div>
        <button onClick={() => setShowPinyin(value => !value)} className="shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{showPinyin ? '隐藏拼音' : '显示拼音'}</button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <select aria-label="语块分类" value={category} onChange={event => { stopSpeaking(); setCategory(event.target.value); }} className="w-full min-w-0 rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-600">
          <option value="">全部分类</option>{phraseBlocks.map((group, index) => <option key={group.title} value={group.title}>{categoryNumbers[index]}、{group.title}</option>)}
        </select>
        <input aria-label="搜索语块" placeholder="搜索中文、老挝文或拼音" value={query} onChange={event => { stopSpeaking(); setQuery(event.target.value); }} className="lao-text w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-600" />
      </div>
    </header>
    <main className="space-y-6 px-4 py-4">
      {groups.map(group => <section key={group.title}>
        <h2 className="mb-3 text-base font-semibold">{categoryNumbers[phraseBlocks.findIndex(item => item.title === group.title)]}、{group.title}</h2>
        <div className="space-y-3">{group.items.map(item => <article key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><span className="mr-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{item.id}.</span><span className="lao-text break-words text-xl leading-relaxed">{item.lao}</span></div>{audioButton(`block-${item.id}`, item.lao)}</div>
            {showPinyin && <p className="mt-1 break-words text-sm text-orange-600 dark:text-orange-400">{item.pinyin}</p>}
            <p className="mt-1 text-sm leading-relaxed">{item.chinese}</p>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="px-4 pt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">例子：</div>
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">{item.examples.map((example, index) => <div key={index} className="p-4 pt-2">
            <div className="flex items-start gap-3"><p className="lao-text min-w-0 flex-1 break-words text-lg leading-relaxed">{example.lao}</p>{audioButton(`example-${item.id}-${index}`, example.lao)}</div>
            {showPinyin && <p className="mt-1 break-words text-sm text-orange-600 dark:text-orange-400">{example.pinyin}</p>}
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{example.chinese}</p>
          </div>)}</div></div>
        </article>)}</div>
      </section>)}
      {!groups.length && <p className="py-10 text-center text-sm text-gray-500">没有匹配的语块</p>}
    </main>
  </div>;
}
