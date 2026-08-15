import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface OfflineWhisperResult {
  text: string;
  audioBase64: string;
  durationMs: number;
  engine: 'offline-whisper';
}

interface OfflineWhisperPlugin {
  getStatus(): Promise<{ available: boolean; model: string; offline: boolean }>;
  startRecording(): Promise<void>;
  stopAndTranscribe(): Promise<OfflineWhisperResult>;
  cancelRecording(): Promise<void>;
  addListener(
    eventName: 'audioLevel',
    listener: (event: { value: number }) => void,
  ): Promise<PluginListenerHandle>;
}

export const OfflineWhisper = registerPlugin<OfflineWhisperPlugin>('OfflineWhisper');
