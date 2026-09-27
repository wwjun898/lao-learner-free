import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function ExplainButton({ text, category }: { text: string; category: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-indigo-50 px-2 text-sm text-indigo-700" title="AI解释">
      <Sparkles size={16} />AI解释
    </button>
    {open && <div role="dialog" aria-modal="true" aria-label="AI解释" className="fixed inset-0 z-40 overflow-y-auto bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-sm rounded-xl bg-white p-5 text-center text-gray-800 shadow-xl"><p className="text-sm">AI 解析将在后续版本开放</p><button className="mt-4 text-sm text-blue-600" onClick={() => setOpen(false)}>关闭</button></div>
    </div>}
  </>;
}
