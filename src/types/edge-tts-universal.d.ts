declare module 'edge-tts-universal' {
  interface EdgeTtsOptions {
    rate?: string;
    volume?: string;
    pitch?: string;
  }

  interface SynthesisResult {
    audio: Blob;
  }

  export class EdgeTTS {
    constructor(text: string, voice: string, options?: EdgeTtsOptions);
    synthesize(): Promise<SynthesisResult>;
  }
}
