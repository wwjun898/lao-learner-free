export const industrySentenceCategory = '自身行业句子';
export function renameIndustryCategory(category: string): string {
  return category === '自身行业短语' ? industrySentenceCategory : category;
}
