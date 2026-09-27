import { Capacitor, registerPlugin } from '@capacitor/core';

const MicrosoftSpeech = registerPlugin<{ synthesize(options: { text: string; slow: boolean }): Promise<{ audioBase64: string }> }>('MicrosoftSpeech');
const pending = new Map<string, Promise<Blob>>();

function bytes(value: string) {
  const binary = atob(value);
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
  return result;
}

export async function synthesizeLaoAudio(text: string, slow = false): Promise<Blob> {
  const normalized = text.normalize('NFC').trim();
  if (!normalized) throw new Error('没有可朗读的文字');
  const key = `${slow ? 'slow' : 'normal'}:${normalized}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const task = (async () => {
    let audio: Blob;
    if (Capacitor.isNativePlatform()) {
      const result = await MicrosoftSpeech.synthesize({ text: normalized, slow });
      audio = new Blob([bytes(result.audioBase64)], { type: 'audio/mpeg' });
    } else {
      const response = await fetch(`/api/tts?text=${encodeURIComponent(normalized)}&mode=${slow ? 'slow' : 'normal'}`, { signal: AbortSignal.timeout(40000) });
      if (!response.ok) throw new Error('微软语音服务暂时不可用，请检查网络');
      audio = await response.blob();
    }
    if (audio.size < 512) throw new Error('微软语音未返回有效音频');
    return audio;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
