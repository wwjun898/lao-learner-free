export type AiProvider = 'gemini' | 'zhipu';
export type AiMode = 'google' | 'zhipu';

export interface AnalysisExample {
  lao: string;
  pinyin: string;
  chinese: string;
}

export interface LaoAnalysis {
  sourceText: string;
  normalizedLao: string;
  pinyin: string;
  partOfSpeech: string;
  chineseMeaning: string;
  detailedMeanings: string[];
  wordFormation: string;
  usageNotes: string[];
  examples: AnalysisExample[];
  suggestedCategory: string;
  contentType: 'word' | 'phrase';
}

export interface AiConfigStatus {
  mode: AiMode;
  configured: boolean;
  apiBase: string;
}

export interface AnalysisResponse {
  analysis: LaoAnalysis;
  provider: AiProvider;
  model: string;
}
