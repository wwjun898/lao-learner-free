import { useState } from 'react';
import type { Page } from '../hooks/useNavigation';
import { useTheme } from '../hooks/useTheme';

interface Props { navigate: (page: Page) => void }

const mainFeatures = [
  { page: 'vocabulary' as Page, icon: '词', title: '主题词汇', subtitle: '生活 · 工作 · 旅行', color: 'from-green-500 to-emerald-600' },
  { page: 'dialogue' as Page, icon: '💬', title: '实用对话', subtitle: '日常情景表达', color: 'from-orange-500 to-amber-500' },
  { page: 'flashcard' as Page, icon: '🃏', title: '翻卡复习', subtitle: '重点优先复习', color: 'from-red-500 to-rose-500' },
  { page: 'scenario' as Page, icon: '📍', title: '场景练习 AI 生成', subtitle: '配合后续 AI 造句开放', color: 'from-cyan-500 to-teal-500' },
];

const tools = [
  { page: 'search' as Page, icon: '✨', title: 'AI解析', subtitle: '后续开放', accent: 'bg-cyan-50 dark:bg-cyan-900/20', locked: true },
  { page: 'analysis-library' as Page, icon: '📚', title: '解析库', subtitle: '后续开放', accent: 'bg-emerald-50 dark:bg-emerald-900/20', locked: true },
  { page: 'word-formation' as Page, icon: '🔤', title: '构词法', subtitle: '常用构词法', accent: 'bg-violet-50 dark:bg-violet-900/20' },
  { page: 'generate-scene' as Page, icon: '📌', title: 'AI 造场景练习句', subtitle: '后续开放', accent: 'bg-pink-50 dark:bg-pink-900/20', locked: true },
  { page: 'phrase-blocks' as Page, icon: '🧩', title: '常用语块', subtitle: '十二类语块', accent: 'bg-amber-50 dark:bg-amber-900/20' },
  { page: 'calculator' as Page, icon: '🧮', title: '计算器', subtitle: '报价工具', accent: 'bg-orange-50 dark:bg-orange-900/20' },
];

export default function HomePage({ navigate }: Props) {
  const { toggleTheme, isDark } = useTheme();
  const [notice, setNotice] = useState('');
  const openTool = (item: typeof tools[number]) => {
    if (item.locked) { setNotice(`${item.title}将在后续版本开放`); return; }
    navigate(item.page);
  };
  return <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
    <header className="bg-[#a82c43] px-6 pb-9 pt-12 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[26px] font-bold leading-tight">老挝语口语学习</h1><div className="lao-text mt-1 text-lg font-semibold text-white/80">ຮຽນເວົ້າພາສາລາວ</div></div>
        <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/15 text-lg" aria-label="切换主题">{isDark ? '☀️' : '🌙'}</button>
      </div>
    </header>
    <section aria-label="主要学习功能" className="relative z-10 mx-5 -mt-4 rounded-3xl bg-white p-5 shadow-lg dark:bg-[#1a1a1a]"><div className="grid grid-cols-4 grid-rows-[auto_auto_auto] gap-x-2 gap-y-2">
      {mainFeatures.map(item => <button key={item.page} onClick={() => navigate(item.page)} className="row-span-3 grid min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-subgrid justify-items-center text-center active:scale-95">
        <div className={`flex aspect-square w-14 max-w-full items-center justify-center self-start rounded-2xl bg-gradient-to-br ${item.color} text-2xl font-bold text-white shadow-lg`}>{item.icon}</div>
        <div className="min-h-10 w-full self-start break-words text-xs font-semibold leading-5 text-gray-800 dark:text-white">{item.page === 'scenario' ? <><span className="block">场景练习</span><span className="block">AI 生成</span></> : item.title}</div>
        <div className="w-full self-start break-words text-[10px] leading-4 text-gray-400">{item.subtitle}</div>
      </button>)}
    </div></section>
    <section className="mt-6 px-5"><h2 className="mb-3 text-base font-bold text-gray-800 dark:text-white">实用工具</h2><div className="grid grid-cols-3 gap-2.5">
      {tools.map(item => <button key={item.page} onClick={() => openTool(item)} className={`relative flex flex-col items-center gap-2 rounded-2xl bg-white p-3.5 shadow-sm dark:bg-[#1a1a1a] ${item.locked ? 'opacity-70' : ''}`}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.accent}`}>{item.icon}</div><div className="text-center"><div className="text-[11px] font-semibold text-gray-800 dark:text-white">{item.title}</div><div className={`text-[9px] ${item.locked ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>{item.subtitle}</div></div>{item.locked && <span aria-hidden="true" className="absolute right-2 top-2 text-[11px]">🔒</span>}
      </button>)}
    </div></section>
    {notice && <div role="status" className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><span>{notice}</span><button type="button" onClick={() => setNotice('')} className="ml-3 text-base" aria-label="关闭提示">×</button></div>}
    <footer className="pb-7 pt-6 text-center text-[11px] text-gray-400">V1.9.3</footer>
  </div>;
}
