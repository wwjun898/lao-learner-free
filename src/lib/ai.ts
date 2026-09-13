import { Capacitor, CapacitorHttp, registerPlugin, type HttpOptions } from '@capacitor/core';
import type { AiConfigStatus, AiMode, AnalysisResponse, LaoAnalysis } from '../types/ai';
import { sceneRequest, sceneFromGemini, validateScene, validateSceneInput, type GeneratedScene } from './sceneGeneration';

interface SaveAiConfigInput {
  mode: AiMode;
  apiKey?: string;
}

interface StoredAiConfig {
  mode: AiMode;
  googleApiKey: string;
}

const STORAGE_KEY = 'lao-learner-ai-config';
const DEFAULT_GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';
const GOOGLE_GEMINI_MODEL = 'gemini-3.5-flash';
const categories = [
  '数字', '货币', '时间', '日期', '大小', '重量', '长度', '形状', '颜色', '状态',
  '方位', '风景', '家庭', '职业', '身体部位', '看病健康', '人际关系', '社交礼貌',
  '喜怒哀乐', '同意反对', '担心满意', '动物植物', '地名属地', '常用名词',
  '常用动词', '常用副词', '常用形容词', '常用介词连词',
];

const responseSchema = {
  type: 'object',
  properties: {
    sourceText: { type: 'string' },
    normalizedLao: { type: 'string' },
    pinyin: { type: 'string' },
    partOfSpeech: { type: 'string' },
    chineseMeaning: { type: 'string' },
    detailedMeanings: { type: 'array', items: { type: 'string' } },
    wordFormation: { type: 'string' },
    usageNotes: { type: 'array', items: { type: 'string' } },
    examples: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lao: { type: 'string' },
          pinyin: { type: 'string' },
          chinese: { type: 'string' },
        },
        required: ['lao', 'pinyin', 'chinese'],
      },
    },
    suggestedCategory: { type: 'string', enum: categories },
    contentType: { type: 'string', enum: ['word', 'phrase'] },
  },
  required: [
    'sourceText', 'normalizedLao', 'pinyin', 'partOfSpeech', 'chineseMeaning',
    'detailedMeanings', 'wordFormation', 'usageNotes', 'examples', 'suggestedCategory', 'contentType',
  ],
};

function isNativeApp() {
  return Capacitor.isNativePlatform();
}

function emptyConfig(): StoredAiConfig {
  return { mode: 'google', googleApiKey: '' };
}

function geminiGenerateContentUrl(model: string, apiBase = DEFAULT_GEMINI_API_BASE): string {
  return `${apiBase}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

function activeApiKey(config: StoredAiConfig) {
  return config.googleApiKey;
}

function geminiHeaders(apiKey: string): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
}

function readNativeConfig(): StoredAiConfig {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<StoredAiConfig> & {
      geminiApiKey?: string;
    };
    return {
      mode: 'google',
      googleApiKey: typeof value.googleApiKey === 'string'
        ? value.googleApiKey
        : (typeof value.geminiApiKey === 'string' ? value.geminiApiKey : ''),
    };
  } catch {
    return emptyConfig();
  }
}

function configStatus(config: StoredAiConfig): AiConfigStatus {
  return {
    mode: config.mode,
    configured: Boolean(activeApiKey(config)),
    apiBase: DEFAULT_GEMINI_API_BASE,
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const payload = await response.json().catch(() => ({ error: '本地 AI 服务返回了无效响应' }));
  if (!response.ok) {
    const nestedMessage = payload.error && typeof payload.error === 'object'
      ? (payload.error as Record<string, unknown>).message
      : undefined;
    const detail = typeof payload.error === 'string'
      ? payload.error
      : typeof nestedMessage === 'string' ? nestedMessage : 'AI 请求失败';
    if (response.status === 401 || response.status === 403) {
      throw new Error(`API Key 无效、无模型权限或当前额度不足：${detail}`);
    }
    if (response.status === 429) {
      throw new Error('请求过于频繁或当前额度已用完，请稍后再试。');
    }
    throw new Error(`AI 请求失败（${response.status}）：${detail}`);
  }
  return payload as T;
}

function createPrompt(text: string, repairIssues: string[] = []) {
  return `你是一名严谨的老挝语语言教师。请分析用户提供的老挝语词语或短句，面向中文学习者输出准确、实用的解释。

要求：
1. 给出规范老挝文、便于跟读的拉丁转写、词性和简明中文核心释义。
2. 分点说明不同语境下的含义；分析构词方式，短句则分析关键成分和语序。
3. 给出2至4条用法提示，以及2至3个自然、常用的老挝语例句，每条例句附拉丁转写和中文。
4. suggestedCategory只能从以下分类中选择一个：${categories.join('、')}。
5. contentType必须为word或phrase：单个词、固定词组填word；完整短语或短句填phrase。
6. 所有老挝文只能使用老挝文字母（Unicode U+0E80-U+0EFF），严禁混入泰文字符。
7. 只输出符合指定结构的JSON对象，不要输出Markdown。
8. chineseMeaning、pinyin、wordFormation不得为空；detailedMeanings至少2条，usageNotes至少2条，examples至少2条。无法确定时明确说明不确定之处，禁止编造。
${repairIssues.length ? `9. 上一次回答不合格，必须修正这些问题：${repairIssues.join('；')}。` : ''}

JSON必须只包含这些字段：sourceText、normalizedLao、pinyin、partOfSpeech、chineseMeaning、detailedMeanings（字符串数组）、wordFormation、usageNotes（字符串数组）、examples（每项包含lao、pinyin、chinese）、suggestedCategory、contentType。

待分析内容：<lao_input>${text}</lao_input>`;
}

function parseModelJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') throw new Error('AI 未返回可解析内容');
  return JSON.parse(value.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')) as Record<string, unknown>;
}

function normalizeAnalysis(value: Record<string, unknown>, sourceText: string): LaoAnalysis {
  const stringValue = (key: string, fallback = '') => typeof value[key] === 'string' ? value[key].trim() : fallback;
  const stringArray = (key: string) => Array.isArray(value[key])
    ? value[key].filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
  const cleanRomanization = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  const source = sourceText.normalize('NFC').trim();
  const candidate = stringValue('normalizedLao', source).normalize('NFC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();
  const invalidCandidate = /[\u0E00-\u0E7F\uFFFD\u25A1]/.test(candidate)
    || (/[຀-໿]/.test(source) && !/[຀-໿]/.test(candidate));
  const suggested = stringValue('suggestedCategory', '社交礼貌');
  const partOfSpeech = stringValue('partOfSpeech', '词语/短句');
  const examples = Array.isArray(value.examples) ? value.examples.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (typeof record.lao !== 'string' || typeof record.chinese !== 'string' || /[\u0E00-\u0E7F]/.test(record.lao)) return [];
    return [{
      lao: record.lao.trim(),
      pinyin: typeof record.pinyin === 'string' ? cleanRomanization(record.pinyin.trim()) : '',
      chinese: record.chinese.trim(),
    }];
  }) : [];

  return {
    sourceText,
    normalizedLao: invalidCandidate ? source : (candidate || source),
    pinyin: cleanRomanization(stringValue('pinyin')),
    partOfSpeech,
    chineseMeaning: stringValue('chineseMeaning', '暂无释义'),
    detailedMeanings: stringArray('detailedMeanings'),
    wordFormation: stringValue('wordFormation', '暂无构词说明'),
    usageNotes: stringArray('usageNotes'),
    examples,
    suggestedCategory: categories.includes(suggested) ? suggested : '社交礼貌',
    contentType: value.contentType === 'phrase' || /短语|短句|句子|句型/.test(partOfSpeech) ? 'phrase' : 'word',
  };
}

function analysisQualityIssues(analysis: LaoAnalysis): string[] {
  const issues: string[] = [];
  if (!analysis.chineseMeaning || analysis.chineseMeaning === '暂无释义') issues.push('缺少中文核心释义');
  if (!analysis.pinyin) issues.push('缺少拉丁转写');
  if (!analysis.wordFormation || analysis.wordFormation === '暂无构词说明') issues.push('缺少构词或语序分析');
  if (analysis.detailedMeanings.length < 2) issues.push('详细释义少于2条');
  if (analysis.usageNotes.length < 2) issues.push('用法提示少于2条');
  if (analysis.examples.length < 2) issues.push('例句少于2条');
  if (/[\u0E00-\u0E7F\uFFFD\u25A1]/.test(analysis.normalizedLao)) issues.push('老挝文包含泰文或无效字符');
  return issues;
}

async function nativeHttp(options: HttpOptions, providerName: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await CapacitorHttp.request({ connectTimeout: 15000, readTimeout: 30000, ...options });
    if (response.status >= 200 && response.status < 300) {
      return response.data as Record<string, unknown>;
    }
    const nested = response.data?.error?.message;
    const detail = typeof nested === 'string' ? nested : '';
    if ((response.status === 402 || response.status === 403) && /balance|insufficient|recharge|quota/i.test(detail)) {
      throw new Error(`${providerName}账户余额或体验额度不足，请在服务商控制台检查余额和计费状态`);
    }
    if (response.status === 401) {
      throw new Error(`${providerName} API Key 无效或已失效，请重新填写`);
    }
    if (response.status === 429) {
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
        continue;
      }
      throw new Error(`${providerName}请求过于频繁或当前额度已用完，请稍后再试`);
    }
    throw new Error(`${providerName}请求失败（${response.status}）${detail ? `：${detail}` : ''}`);
  }
  throw new Error(`${providerName}请求失败，请稍后再试`);
}

async function analyzeWithGemini(text: string, config: StoredAiConfig): Promise<AnalysisResponse> {
  const model = GOOGLE_GEMINI_MODEL;
  const apiKey = config.googleApiKey;
  const providerName = 'Google Gemini';
  let issues: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const payload = await nativeHttp({
      url: geminiGenerateContentUrl(model),
      method: 'POST',
      headers: geminiHeaders(apiKey),
      data: {
        contents: [{ parts: [{ text: createPrompt(text, issues) }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema },
      },
    }, providerName);
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
    const content = (candidates[0] as { content?: { parts?: Array<{ text?: string }> } } | undefined)?.content;
    const output = content?.parts?.map(part => part.text || '').join('') || '';
    const analysis = normalizeAnalysis(parseModelJson(output), text);
    issues = analysisQualityIssues(analysis);
    if (issues.length === 0) return { analysis, provider: 'gemini', model };
  }
  throw new Error(`${providerName}解析内容不完整：${issues.join('、')}，请重试`);
}

export async function getAiConfig(): Promise<AiConfigStatus> {
  return isNativeApp() ? configStatus(readNativeConfig()) : requestJson<AiConfigStatus>('/api/ai/config');
}

export async function saveAiConfig(input: SaveAiConfigInput): Promise<AiConfigStatus> {
  if (input.mode !== 'google') throw new Error('仅支持 Google Gemini，请刷新后重新设置');
  if (!isNativeApp()) {
    return requestJson<AiConfigStatus>('/api/ai/config', { method: 'POST', body: JSON.stringify(input) });
  }
  const current = readNativeConfig();
  const next: StoredAiConfig = {
    mode: 'google',
    googleApiKey: input.apiKey?.trim() || current.googleApiKey,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return configStatus(next);
}

export async function clearAiConfig(): Promise<AiConfigStatus> {
  if (!isNativeApp()) return requestJson<AiConfigStatus>('/api/ai/config', { method: 'DELETE' });
  localStorage.removeItem(STORAGE_KEY);
  return configStatus(emptyConfig());
}

export async function analyzeLao(text: string): Promise<AnalysisResponse> {
  if (!isNativeApp()) {
    return requestJson<AnalysisResponse>('/api/ai/analyze', {
      method: 'POST', body: JSON.stringify({ text }),
    });
  }
  const config = readNativeConfig();
  if (!activeApiKey(config)) throw new Error('请先配置 Google Gemini API Key');
  return analyzeWithGemini(text, config);
}

export function hasNativeGeminiConfig() {
  const config = readNativeConfig();
  return isNativeApp() && Boolean(config.googleApiKey);
}

export async function generateScene(words: string[], categories: string[]): Promise<GeneratedScene> {
  const input = validateSceneInput(words, categories);
  if (!isNativeApp()) {
    const result = await requestJson<GeneratedScene>('/api/ai/generate-scene', {
      method: 'POST', body: JSON.stringify(input),
    });
    return validateScene(result, input.categories);
  }
  const config = readNativeConfig();
  if (!config.googleApiKey) throw new Error('请先配置 Google Gemini API Key');
  const payload = await nativeHttp({
    url: geminiGenerateContentUrl(GOOGLE_GEMINI_MODEL), method: 'POST',
    headers: geminiHeaders(config.googleApiKey), data: sceneRequest(input.words, input.categories), readTimeout: 60000,
  }, 'Google Gemini');
  return sceneFromGemini(payload, input.categories);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}


function openSpeechCache(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('lao-learner-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('speech');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSpeechCache(key: string): Promise<ArrayBuffer | null> {
  const database = await openSpeechCache();
  return new Promise<ArrayBuffer | null>((resolve, reject) => {
    const request = database.transaction('speech', 'readonly').objectStore('speech').get(key);
    request.onsuccess = () => resolve(request.result instanceof ArrayBuffer ? request.result : null);
    request.onerror = () => reject(request.error);
  }).finally(() => database.close());
}

async function writeSpeechCache(key: string, audio: ArrayBuffer) {
  const database = await openSpeechCache();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('speech', 'readwrite');
    transaction.objectStore('speech').put(audio, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }).finally(() => database.close());
}

const MicrosoftSpeech = registerPlugin<{ synthesize(options: { text: string; slow: boolean }): Promise<{ audioBase64: string }> }>('MicrosoftSpeech');
const pendingSpeech = new Map<string, Promise<Blob>>();

export async function synthesizeLaoAudio(text: string, slow = false): Promise<Blob> {
  const normalizedText = text.normalize('NFC').trim();
  if (!normalizedText) throw new Error('没有可朗读的文字');
  const cacheKey = `microsoft-mp3-v1:Chanthavong:${slow ? 'slow' : 'normal'}:${normalizedText}`;
  const cached = await readSpeechCache(cacheKey).catch(() => null);
  if (cached) return new Blob([cached], { type: 'audio/mpeg' });
  const pending = pendingSpeech.get(cacheKey);
  if (pending) return pending;
  const task = (async () => {
    let audio: Blob;
    if (isNativeApp()) {
      const result = await MicrosoftSpeech.synthesize({ text: normalizedText, slow });
      const bytes = base64ToBytes(result.audioBase64);
      audio = new Blob([bytes], { type: 'audio/mpeg' });
    } else {
      const response = await fetch(`/api/tts?text=${encodeURIComponent(normalizedText)}&mode=${slow ? 'slow' : 'normal'}`, { signal: AbortSignal.timeout(40000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) {
        throw new Error('微软语音服务暂时不可用，请检查网络和本地服务');
      }
      audio = await response.blob();
    }
    if (audio.size < 512) throw new Error('微软语音未返回有效音频');
    await writeSpeechCache(cacheKey, await audio.arrayBuffer()).catch(() => undefined);
    return audio;
  })();
  pendingSpeech.set(cacheKey, task);
  try { return await task; } finally { pendingSpeech.delete(cacheKey); }
}

export async function transcribeLaoAudio(audio: Blob): Promise<string> {
  if (!isNativeApp()) throw new Error('音频转写仅用于安卓应用');
  const config = readNativeConfig();
  const apiKey = config.googleApiKey;
  if (!apiKey) throw new Error('在线语音识别需要 Google Gemini API Key');
  if (audio.size === 0) throw new Error('没有录到有效声音，请重新跟读');
  if (audio.size > 18 * 1024 * 1024) throw new Error('录音文件过大，请缩短跟读时间');

  const model = GOOGLE_GEMINI_MODEL;
  const providerName = 'Google Gemini 语音识别';
  const payload = await nativeHttp({
    url: geminiGenerateContentUrl(model),
    method: 'POST',
    headers: geminiHeaders(apiKey),
    data: {
      contents: [{
        parts: [
          {
            text: '请逐字转写这段老挝语跟读录音。只记录实际听到的内容，使用规范老挝文（Unicode U+0E80-U+0EFF），不要翻译，不要补充说明。若没有听清老挝语，transcript返回空字符串。',
          },
          {
            inlineData: {
              mimeType: audio.type.split(';')[0] || 'audio/webm',
              data: arrayBufferToBase64(await audio.arrayBuffer()),
            },
          },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: { transcript: { type: 'string' } },
          required: ['transcript'],
        },
      },
    },
  }, providerName);

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const content = (candidates[0] as { content?: { parts?: Array<{ text?: string }> } } | undefined)?.content;
  const output = content?.parts?.map(part => part.text || '').join('') || '';
  const parsed = parseModelJson(output);
  const transcript = typeof parsed.transcript === 'string' ? parsed.transcript.normalize('NFC').trim() : '';
  if (!transcript) throw new Error('Gemini没有听清老挝语，请靠近麦克风并放慢速度重试');
  if (/[\u0E00-\u0E7F]/.test(transcript)) throw new Error('识别结果混入了泰文字符，请重新朗读');
  return transcript;
}
