import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabulary, categories, normalizeVocabularyCategory } from '../src/data/vocabulary.ts';
import document from '../src/data/vocabularyDocument.json' with { type: 'json' };

assert.equal(document.length, 31);
assert.deepEqual(categories, document.map(section => section.category));
assert.equal(new Set(categories).size, 31);
const keys = new Set();
for (const word of vocabulary) {
  assert.ok(categories.includes(word.category), `Unknown category: ${word.category}`);
  const key = JSON.stringify([word.category, word.lao]);
  assert.ok(!keys.has(key), `Duplicate card: ${key}`);
  keys.add(key);
}
for (const section of document) {
  assert.equal(section.items.length, 50, section.category);
  const actual = vocabulary.filter(item => item.category === section.category);
  assert.ok(actual.length >= 50, section.category);
  for (const [lao, chinese, pinyin] of section.items) {
    assert.ok(lao && chinese && pinyin, section.category);
    assert.ok(!/[\u0e00-\u0e7f]/.test(lao), `Thai script: ${lao}`);
    assert.ok(actual.some(word => word.lao === lao && word.chinese === chinese && word.pinyin === pinyin), `Missing/changed entry: ${lao}`);
  }
}
assert.equal(normalizeVocabularyCategory('大小'), '大小与度量');
assert.equal(normalizeVocabularyCategory('看病健康'), '看病与健康');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
assert.equal(pkg.version, '1.7.0');
const home = readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8');
assert.ok(home.includes('V1.7.0'));
const android = readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
assert.match(android, /versionCode 17\b/);
assert.match(android, /versionName "1\.7\.0"/);
console.log('PASS: 31 categories, all 1550 source entries preserved, no duplicate category cards, V1.7.0 synchronized.');
console.table(categories.map(category => ({ category, count: vocabulary.filter(item => item.category === category).length })));
