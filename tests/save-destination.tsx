// Manual regression fixture: memory-only storage and a fake AI response. No keys or paid calls.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SearchPage from '../src/pages/SearchPage';
import '../src/index.css';

const memory = new Map<string, string>();
Object.defineProperty(window, 'localStorage', { value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, String(value)),
  removeItem: (key: string) => memory.delete(key),
} });
window.fetch = async (input) => {
  const url = String(input);
  if (url.endsWith('/api/ai/config')) return Response.json({ mode: 'google', configured: true, apiBase: '' });
  if (url.endsWith('/api/ai/analyze')) return Response.json({ provider: 'gemini', model: 'fixture', analysis: {
    sourceText: 'ທົດສອບ', normalizedLao: 'ທົດສອບ', pinyin: 'thot sop', partOfSpeech: '测试',
    chineseMeaning: '测试词', detailedMeanings: ['测试释义'], wordFormation: '测试构词', usageNotes: [],
    examples: [], suggestedCategory: '颜色与外观', contentType: 'phrase',
  } });
  throw new Error('Fixture blocks all other network requests');
};
function Fixture() {
  const [mount, setMount] = useState(0);
  const [result, setResult] = useState('');
  return <><button onClick={() => setMount(mount + 1)}>Remount</button>
    <button onClick={() => setResult(JSON.stringify(Object.fromEntries(memory), null, 2))}>Inspect saved data</button>
    <pre style={{whiteSpace:'pre-wrap'}}>{result}</pre><SearchPage key={mount} goBack={() => {}} /></>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
