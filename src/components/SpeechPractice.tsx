import { useEffect, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

interface Props { targetText: string; chineseText: string; pinyin?: string; onClose: () => void }

export default function SpeechPractice({ targetText, chineseText, pinyin, onClose }: Props) {
  const { isListening, transcript, isSpeaking, listeningError, recognitionStatus, inputLevel, recordedAudioUrl, speakLao, speakSlow, speakChinese, startListening, stopListening, compareText, stopSpeaking } = useSpeech();
  const [activePlayback, setActivePlayback] = useState<'lao' | 'slow' | 'chinese' | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  useEffect(() => { if (!isSpeaking) setActivePlayback(null); }, [isSpeaking]);
  useEffect(() => { if (!isListening) return; setRecordingSeconds(0); const timer = window.setInterval(() => setRecordingSeconds(n => n + 1), 1000); return () => window.clearInterval(timer); }, [isListening]);
  useEffect(() => () => stopListening(), [stopListening]);
  useEffect(() => { if (!isListening && transcript) setScore(compareText(targetText, transcript)); }, [isListening, transcript, targetText, compareText]);
  const play = (kind: 'lao' | 'slow' | 'chinese') => { setActivePlayback(kind); if (kind === 'lao') speakLao(targetText); if (kind === 'slow') speakSlow(targetText); if (kind === 'chinese') speakChinese(chineseText); };
  const close = () => { stopListening(); stopSpeaking(); onClose(); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"><div className="flex h-[min(90dvh,760px)] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-gray-800">
    <header className="shrink-0 border-b border-gray-100 px-6 py-4 dark:border-gray-700"><div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-300" /><h2 className="text-center text-lg font-semibold dark:text-white">🎤 语音跟读</h2></header>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
      <div className="rounded-2xl bg-blue-50 p-5 text-center dark:bg-blue-900/30"><div className="mb-2 text-xs text-blue-400">跟读目标</div><div className="lao-text mb-2 text-4xl font-bold text-gray-800 dark:text-white">{targetText}</div><div className="text-lg text-gray-600 dark:text-gray-300">{chineseText}</div>{pinyin && <div className="mt-1 font-mono text-sm text-amber-600">{pinyin}</div>}</div>
      <div><div className="mb-2 text-xs text-gray-500">🔊 点击听发音：</div><div className="grid grid-cols-3 gap-2">
        {([['lao', '🔊 老挝语', 'bg-emerald-700'], ['slow', '🐢 慢速', 'bg-amber-500'], ['chinese', '中文', 'bg-sky-600']] as const).map(([kind, label, color]) => <button key={kind} onClick={() => play(kind)} aria-disabled={isSpeaking} className={`h-12 rounded-xl ${color} text-sm font-semibold text-white ${activePlayback === kind ? 'ring-4 ring-white/60' : ''}`}>{activePlayback === kind ? '播放中' : label}</button>)}
      </div></div>
      <button onClick={() => isListening ? stopListening() : startListening()} className={`w-full rounded-2xl py-4 text-lg font-bold text-white ${isListening ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>{isListening ? '⏹️ 停止录音' : '🎙️ 开始跟读'}</button>
      {isListening && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><div className="flex justify-between"><span>正在录音，请朗读上方老挝语</span><span>{recordingSeconds} 秒</span></div><div className="mt-3 flex h-8 items-center justify-center gap-1">{[.55,.8,1,.7,.9,.6,.75].map((factor, i) => <span key={i} className="w-1.5 rounded-full bg-red-500" style={{ height: `${Math.max(5, inputLevel * 28 * factor)}px` }} />)}</div><p className="mt-1 text-center text-xs">最长录音 10 秒，也可以手动停止</p></div>}
      {listeningError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{listeningError}</div>}
      {recognitionStatus && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{recognitionStatus}</div>}
      {recordedAudioUrl && !isListening && <div className="rounded-xl bg-gray-50 p-4"><div className="mb-2 text-xs text-gray-500">回听本次录音</div><audio className="h-10 w-full" src={recordedAudioUrl} controls /></div>}
      {transcript && <div className="rounded-xl bg-gray-50 p-4"><div className="text-xs text-gray-400">识别结果</div><div className="lao-text text-xl text-gray-800">{transcript}</div>{score !== null && <div className="mt-2 text-lg font-bold text-emerald-600">匹配度 {score} 分</div>}</div>}
      <button onClick={close} className="w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-600">关闭</button>
    </div>
  </div></div>;
}
