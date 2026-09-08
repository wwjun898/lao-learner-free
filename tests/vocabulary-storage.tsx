// Browser regression test with isolated in-memory storage. Does not touch user data.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useVocabulary } from '../src/hooks/useVocabulary';

const memory = new Map<string, string>([
  ['lao-learner-custom-vocabulary', JSON.stringify([{ lao: 'fixture-only', chinese: '已有自定义词',
    pinyin: 'fixture', category: '用户自己的分类', level: 1, priority: false }])],
  ['lao-learner-vocabulary-category-overrides', JSON.stringify({ 'fixture-only': '用户手动调整分类' })],
]);
Object.defineProperty(window, 'localStorage', { value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, String(value)),
  removeItem: (key: string) => memory.delete(key),
} });

function check(condition: boolean, message: string) { if (!condition) throw new Error(message); }
function Test() {
  const api = useVocabulary();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('RUNNING');
  useEffect(() => {
    try {
      check(api.vocabulary.some(word => word.lao === 'fixture-only' && word.category === '用户手动调整分类'), 'User data changed');
      if (step === 0) {
        check(api.vocabulary.filter(word => word.lao === 'ແພງ').length > 1, 'Cross-category entries lost');
        api.togglePriority('ແພງ'); setStep(1);
      } else if (step === 1) {
        check(api.priorityWords.filter(word => word.lao === 'ແພງ').length === 1, 'Duplicate priority card');
        api.moveToCategory('ແພງ', '测试移动分类'); setStep(2);
      } else if (step === 2) {
        const moved = api.vocabulary.filter(word => word.lao === 'ແພງ');
        check(moved.length === 1 && moved[0].category === '测试移动分类', 'Move creates duplicate cards');
        check(api.priorityWords.filter(word => word.lao === 'ແພງ').length === 1, 'Priority lost on move');
        api.removePriority('ແພງ'); setStep(3);
      } else if (step === 3) {
        check(!api.isPriority('ແພງ'), 'Remove priority failed');
        check(JSON.parse(memory.get('lao-learner-vocabulary-category-overrides')!)["ແພງ"] === '测试移动分类', 'Move not persisted');
        setStatus('PASS: cross-category words, unique review cards, move, remove priority, preserved user data.');
      }
    } catch (error) { setStatus(`FAIL: ${error}`); }
  }, [step]);
  return <p>{status}</p>;
}
createRoot(document.getElementById('root')!).render(<Test />);
