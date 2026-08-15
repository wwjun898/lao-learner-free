import type { LaoAnalysis } from '../types/ai';

export function toPlainRomanization(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .normalize('NFC');
}

export function normalizeAnalysisRomanization(analysis: LaoAnalysis): LaoAnalysis {
  return {
    ...analysis,
    pinyin: toPlainRomanization(analysis.pinyin),
    examples: analysis.examples.map(example => ({
      ...example,
      pinyin: toPlainRomanization(example.pinyin),
    })),
  };
}
