import { useSpeech } from '../hooks/useSpeech';
import wordFormationDocument from '../data/wordFormationDocument.json';

interface Props { goBack: () => void }
const laoPattern = /[\u0E80-\u0EFF]/;
const laoPhrasePattern = /[\u0E80-\u0EFF][\u0E80-\u0EFF\sໆ.,!?…]+/g;

function isSectionHeading(text: string) { return /^[一二三四五六七八九十]+、/.test(text); }
function isRootHeading(text: string) { return /^\d+\.\s/.test(text); }

export default function WordFormationPage({ goBack }: Props) {
  const { speakLao } = useSpeech();
  const play = (text: string) => { speakLao(text); };
  const withPronunciation = (text: string) => {
    const matches = [...text.matchAll(laoPhrasePattern)];
    if (!matches.length) return <span>{text}</span>;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    matches.forEach((match, index) => {
      const start = match.index ?? 0;
      const phrase = match[0].trim();
      if (start > cursor) parts.push(<span key={`text-${index}`}>{text.slice(cursor, start)}</span>);
      parts.push(<span key={`lao-${index}`} className="inline-flex items-center gap-1"><span className="lao-text">{phrase}</span><button type="button" onClick={() => play(phrase)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-600 active:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" title="播放老挝语发音" aria-label={`播放 ${phrase}`}>🔊</button></span>);
      cursor = start + match[0].length;
    });
    if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
    return parts;
  };

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-700" aria-label="返回">‹</button><div><h1 className="text-lg font-semibold text-gray-900 dark:text-white">构词法</h1><p className="text-xs text-gray-400">老挝语的构词法</p></div></header>
    <main className="space-y-4 px-4 py-4">
      <section className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"><div className="space-y-3">{wordFormationDocument.map((line, index) => isSectionHeading(line)
        ? <h2 key={index} className="border-t border-gray-200 pt-5 text-lg font-bold leading-8 text-gray-900 first:border-0 first:pt-0 dark:border-gray-700 dark:text-white">{withPronunciation(line)}</h2>
        : isRootHeading(line)
          ? <h3 key={index} className="pt-2 text-base font-semibold leading-8 text-gray-900 dark:text-white">{withPronunciation(line)}</h3>
          : index === 0
            ? <p key={index} className="text-sm leading-8 text-gray-700 dark:text-gray-200">{withPronunciation(line)}</p>
            : <div key={index} className="flex items-start gap-2 pl-1 text-gray-700 dark:text-gray-200">
              <span aria-hidden="true" className="mt-[3px] shrink-0 text-2xl font-black leading-7 text-gray-900 dark:text-white">•</span>
              <p className={`min-w-0 flex-1 text-sm leading-8 ${laoPattern.test(line) ? 'lao-example' : ''}`}>{withPronunciation(line)}</p>
            </div>)}</div></section>
    </main>
  </div>;
}
