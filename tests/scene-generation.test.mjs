import assert from 'node:assert/strict';
import { parseChineseWords, validateScene, sceneFromGemini, sceneRequest, validateSceneInput } from '../src/lib/sceneGeneration.ts';

assert.deepEqual(parseChineseWords('市场，香蕉\n价格、香蕉'), ['市场', '香蕉', '价格']);
assert.throws(() => parseChineseWords(''), /1 到 10/);
assert.throws(() => parseChineseWords(Array.from({ length: 11 }, (_, i) => `词${i}`).join(',')), /1 到 10/);
assert.throws(() => parseChineseWords('hello'), /中文词语/);
assert.throws(() => validateSceneInput(['市场'], []), /分类/);
const categories = ['生意与购物'];
const valid = { title: '买水果', category: categories[0], sentences: [
  { lao: 'ສະບາຍດີ', chinese: '你好', pinyin: 'sabaidee' },
  { lao: 'ຂ້ອຍ', chinese: '我', pinyin: 'khoy' },
  { lao: 'ຂອບໃຈ', chinese: '谢谢', pinyin: 'khop chai' },
] };
assert.deepEqual(validateScene(valid, categories), valid);
assert.throws(() => validateScene({ ...valid, category: '不存在' }, categories), /分类/);
assert.throws(() => validateScene({ ...valid, sentences: valid.sentences.slice(0, 1) }, categories), /数量/);
assert.throws(() => validateScene({ ...valid, sentences: [...valid.sentences.slice(0, 2), valid.sentences[0]] }, categories), /重复/);
assert.throws(() => validateScene({ ...valid, sentences: [...valid.sentences.slice(0, 2), { lao: 'ภาษาไทย', chinese: '泰文', pinyin: 'thai' }] }, categories), /无效文字/);
assert.throws(() => sceneFromGemini({}, categories), /完整/);
assert.deepEqual(sceneFromGemini({ candidates: [{ content: { parts: [{ thought: true, text: 'ignore' }, { text: JSON.stringify(valid) }] } }] }, categories), valid);
assert.deepEqual(sceneRequest(['市场'], categories).generationConfig.responseSchema.properties.category.enum, categories);
console.log('PASS: generation input limits, category boundary, complete Lao output, sentence order, duplicate and malformed response rejection');
