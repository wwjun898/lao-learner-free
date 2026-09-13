import type { Page } from '../hooks/useNavigation';
import { useTheme } from '../hooks/useTheme';
import { useStats } from '../hooks/useStats';

interface Props { navigate: (page: Page) => void }

const mainFeatures = [
  { page: 'vocabulary' as Page, icon: '词', title: '主题词汇', subtitle: '生活 · 工作 · 旅行', color: 'from-green-500 to-emerald-600' },
  { page: 'dialogue' as Page, icon: '💬', title: '实用对话', subtitle: '日常情景表达', color: 'from-orange-500 to-amber-500' },
  { page: 'flashcard' as Page, icon: '🃏', title: '翻卡复习', subtitle: '重点优先复习', color: 'from-red-500 to-rose-500' },
  { page: 'scenario' as Page, icon: '📍', title: '场景练习 AI 生成', subtitle: '出行 · 银行 · 商务', color: 'from-cyan-500 to-teal-500' },
];

const tools = [
  { page: 'search' as Page, icon: '✨', title: 'AI解析', subtitle: '词语 · 短句', accent: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { page: 'analysis-library' as Page, icon: '📚', title: '解析库', subtitle: '完整解析', accent: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { page: 'word-formation' as Page, icon: '🔤', title: '构词法', subtitle: '常用构词法', accent: 'bg-violet-50 dark:bg-violet-900/20' },
  { page: 'generate-scene' as Page, icon: '📌', title: 'AI 造场景练习句', subtitle: '自构中文词语', accent: 'bg-pink-50 dark:bg-pink-900/20' },
  { page: 'stats' as Page, icon: '📊', title: '统计', subtitle: '学习进度', accent: 'bg-amber-50 dark:bg-amber-900/20' },
  { page: 'calculator' as Page, icon: '🧮', title: '计算器', subtitle: '报价工具', accent: 'bg-orange-50 dark:bg-orange-900/20' },
];

export default function HomePage({ navigate }: Props) {
  const { toggleTheme, isDark } = useTheme();
  const { stats } = useStats();
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
      {tools.map(item => <button key={item.page} onClick={() => navigate(item.page)} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3.5 shadow-sm dark:bg-[#1a1a1a]">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.accent}`}>{item.icon}</div><div className="text-center"><div className="text-[11px] font-semibold text-gray-800 dark:text-white">{item.title}</div><div className="text-[9px] text-gray-400">{item.page === 'stats' ? `累计词汇 ${stats.totalWordsLearned}` : item.subtitle}</div></div>
      </button>)}
    </div></section>
    <section className="mx-5 mt-6 mb-4 rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-900/20 dark:from-amber-900/10 dark:to-orange-900/10"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">💡</div><div className="text-xs leading-relaxed text-amber-700 dark:text-amber-300"><div className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-200">用法提示</div><ol className="list-decimal space-y-1 pl-4"><li>主题词汇是基础词汇，每天请认真学习。记不住的词或者认为是重点的词，把它归到翻卡复习里面反复学习。</li><li>反复多听多练实用对话或场景练习并在实际生活中多开口说，善用AI解析。</li><li>AI 解析调用免费 API，会有解析及发音延迟甚至中断的情况，希望大家理解。</li></ol></div></div></section>
    <footer className="pb-7 text-center text-[11px] text-gray-400">V1.8.0 · 开发者 wuzongsheng</footer>
  </div>;
}
