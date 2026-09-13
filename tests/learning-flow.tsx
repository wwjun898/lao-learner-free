// Isolated storage and mock requests: no real API calls or user data changes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import { vocabulary } from '../src/data/vocabulary';
import '../src/index.css';

const memory = new Map<string, string>([
  ['lao-learner-priority-vocabulary', JSON.stringify([vocabulary[0].lao])],
]);
Object.defineProperty(window, 'localStorage', { value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, String(value)),
  removeItem: (key: string) => memory.delete(key),
} });
let analyzeCalls = 0;
let sceneCalls = 0;
window.fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith('/api/ai/config')) return Response.json({ mode: 'google', configured: true, apiBase: 'mock' });
  if (url.endsWith('/api/ai/analyze')) {
    analyzeCalls++;
    const { text } = JSON.parse(String(init?.body));
    return Response.json({ provider: 'gemini', model: 'fixture', analysis: {
      sourceText: text, normalizedLao: text, pinyin: 'thot sop', partOfSpeech: '测试',
      chineseMeaning: '测试词', detailedMeanings: ['测试释义'], wordFormation: '测试构词', usageNotes: ['测试用法'],
      examples: [], suggestedCategory: '颜色与外观', contentType: 'phrase',
    } });
  }
  if (url.endsWith('/api/ai/generate-scene')) {
    sceneCalls++;
    return Response.json({ title: '市场购物测试', category: '生意与购物', sentences: [
      { lao: 'ສະບາຍດີ', chinese: '你好，我要去市场。', pinyin: 'sabaidee' },
      { lao: 'ຂ້ອຍຊື້ໝາກກ້ວຍ', chinese: '我买香蕉。', pinyin: 'khoy seu mak kuay' },
      { lao: 'ຂອບໃຈ', chinese: '谢谢。', pinyin: 'khop chai' },
    ] });
  }
  throw new Error('Fixture blocks all other network requests');
};

function Fixture() {
  const [mount, setMount] = useState(0);
  const [report, setReport] = useState('');
  const [mobile, setMobile] = useState(true);
  return <>
    <div style={{ position: 'relative', zIndex: 100 }}>
      <button onClick={() => setMount(value => value + 1)}>Remount app</button>{' '}
      <button onClick={() => setMobile(value => !value)}>Toggle width</button>{' '}
      <button onClick={() => setReport(JSON.stringify({ analyzeCalls, sceneCalls,
        review: JSON.parse(memory.get('lao-learner-review-cards-v2') ?? '[]'),
        library: JSON.parse(memory.get('lao-learner-analysis-library') ?? '[]'),
        scenes: JSON.parse(memory.get('lao-learner-generated-scenes-v1') ?? '[]'),
        customVocabulary: memory.get('lao-learner-custom-vocabulary'),
        customScenarios: memory.get('lao-learner-custom-scenario-phrases'),
      }, null, 2))}>Inspect data</button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{report}</pre>
    </div>
    <div style={{ width: mobile ? 360 : '100%', margin: 'auto', position: 'relative' }}><App key={mount} /></div>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
