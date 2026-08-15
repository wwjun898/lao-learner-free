export const Capacitor = { isNativePlatform: () => false };
export function registerPlugin<T>(_name: string): T { return { getStatus: async () => ({ available: false, model: '', offline: true }), startRecording: async () => undefined, stopAndTranscribe: async () => ({ text: '', audioBase64: '', durationMs: 0, engine: 'offline-whisper' }), cancelRecording: async () => undefined, addListener: async () => ({ remove: async () => undefined }) } as T; }
export const CapacitorHttp = { request: (options: RequestInit & { url: string }) => fetch(options.url, options).then(async response => ({ status: response.status, data: await response.text() })) };
export const TextToSpeech = { speak: async () => undefined, stop: async () => undefined };
export const SpeechRecognition = {
  checkPermissions: async () => ({ speechRecognition: 'denied', microphone: 'denied' }),
  requestPermissions: async () => ({ speechRecognition: 'denied', microphone: 'denied' }),
  available: async () => ({ available: false }),
  addListener: async () => ({ remove: async () => undefined }),
  start: async () => ({ matches: [] }),
  forceStop: async () => undefined,
};
