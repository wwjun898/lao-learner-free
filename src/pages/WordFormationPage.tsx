import { useSpeech } from '../hooks/useSpeech';
import { wordFormationDocument } from '../data/wordFormation';

interface Props { goBack: () => void }
const laoPattern = /[\u0E80-\u0EFF]+/;
const laoParts = /([\u0E80-\u0EFF]+)/g;

function isHeading(text: string) { return /^(一、|二、|三、|四、|五、|六、|七、|附：)/.test(text); }

export default function WordFormationPage({ goBack }: Props) {
  const { speakLao } = useSpeech();
  const play = (text: string) => { speakLao(text); };
  const withPronunciation = (text: string) => text.split(laoParts).map((part, index) => laoPattern.test(part)
    ? <button key={`${part}-${index}`} onClick={() => play(part)} className="lao-text rounded px-0.5 text-left" title="播放老挝语发音">{part} 🔊</button>
    : <span key={`${part}-${index}`}>{part}</span>);
  const documentLines = wordFormationDocument.filter(line => !line.startsWith('💡'));

  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"><button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-700" aria-label="返回">‹</button><div><h1 className="text-lg font-semibold text-gray-900 dark:text-white">构词法</h1><p className="text-xs text-gray-400">老挝语的构词法</p></div></header>
    <main className="space-y-4 px-4 py-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800"><div className="space-y-3">{documentLines.map((line, index) => isHeading(line) ? <h2 key={index} className="border-t border-gray-100 pt-3 text-base font-bold leading-7 text-gray-900 first:border-0 first:pt-0 dark:border-gray-700 dark:text-white">{withPronunciation(line)}</h2> : <p key={index} className="text-sm leading-7 text-gray-700 dark:text-gray-200">{withPronunciation(line)}</p>)}</div></section>
    </main>
  </div>;
}
