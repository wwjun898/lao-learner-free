import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import SearchPage from '../pages/SearchPage';

export default function ExplainButton({ text, category }: { text: string; category: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-indigo-50 px-2 text-sm text-indigo-700" title="AI解释">
      <Sparkles size={16} />AI解释
    </button>
    {open && <div role="dialog" aria-modal="true" aria-label="AI解释" className="fixed inset-0 z-40 overflow-y-auto bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <SearchPage initialText={text} initialCategory={category} goBack={() => setOpen(false)} />
    </div>}
  </>;
}
