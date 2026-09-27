import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const cacheDir = resolve(process.cwd(), '.tts-cache');
const pending = new Map<string, Promise<Buffer>>();
async function synthesize(text: string, slow: boolean) {
  let EdgeTTS: typeof import('edge-tts-universal').EdgeTTS;
  try { ({ EdgeTTS } = await import('edge-tts-universal')); }
  catch { ({ EdgeTTS } = await import(pathToFileURL(resolve(process.cwd(), 'node_modules/.pnpm/edge-tts-universal@1.4.0_debug@4.4.3/node_modules/edge-tts-universal/dist/index.js')).href)); }
  const key = createHash('sha256').update(`Keomany:${slow}:${text}`).digest('hex');
  const file = resolve(cacheDir, `${key}.mp3`);
  if (existsSync(file)) return readFileSync(file);
  const existing = pending.get(key); if (existing) return existing;
  const task = (async () => {
    const tts = new EdgeTTS(text, 'lo-LA-KeomanyNeural', { rate: slow ? '-35%' : '+0%', volume: '+0%', pitch: '+0Hz' });
    const audio = Buffer.from(await (await tts.synthesize()).audio.arrayBuffer());
    if (audio.length < 512) throw new Error('在线语音服务没有返回有效音频');
    mkdirSync(cacheDir, { recursive: true }); writeFileSync(file, audio); return audio;
  })();
  pending.set(key, task); try { return await task; } finally { pending.delete(key); }
}

function ttsPlugin(): Plugin { return { name: 'lao-learner-tts', configureServer(server) {
  server.middlewares.use(async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname !== '/api/tts' || request.method !== 'GET') return next();
    const text = url.searchParams.get('text')?.trim() ?? '';
    if (!text) { response.statusCode = 400; return response.end('请输入要朗读的老挝语'); }
    if (text.length > 500) { response.statusCode = 400; return response.end('单次朗读请控制在500个字符以内'); }
    try { const audio = await synthesize(text, url.searchParams.get('mode') === 'slow'); response.statusCode = 200; response.setHeader('Content-Type', 'audio/mpeg'); response.end(audio); }
    catch { response.statusCode = 502; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ error: '微软语音服务暂时不可用，请稍后重试' })); }
  });
} }; }

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ttsPlugin()],
  resolve: mode === 'android' ? undefined : {
    alias: {
      '@capacitor/core': './src/lib/capacitorWebShim.ts',
      '@capacitor-community/text-to-speech': './src/lib/capacitorWebShim.ts',
      '@capgo/capacitor-speech-recognition': './src/lib/capacitorWebShim.ts',
    },
  },
  base: mode === 'android' ? './' : '/lao-learner/',
}));
