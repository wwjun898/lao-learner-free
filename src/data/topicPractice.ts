import { documentDialogues, type DocumentDialogueLine } from './documentDialogues';

export type TopicPracticeLine = DocumentDialogueLine;

export interface TopicPractice {
  category: string;
  icon: string;
  title: string;
  scenario: string;
  level: 1 | 2 | 3;
  lines: TopicPracticeLine[];
}

export const scenarioCategories = [
  ...documentDialogues.map(item => item.category),
  '自身行业短语',
] as const;

export const topicPractices: TopicPractice[] = documentDialogues;

// 用户从 AI 解析页面保存的短语会进入这里；该分类默认保持空白，供用户自行添加。
export const scenarioPracticeAdditions: Omit<TopicPracticeLine, 'speaker'>[] = [];

const legacyCategoryMap: Record<string, string> = {
  数字: '数量与度量', 货币: '数量与度量', 时间: '日期与时间', 日期: '日期与时间',
  大小: '大小与形状', 重量: '大小与形状', 长度: '大小与形状', 方位: '位置与方位',
  形状: '大小与形状', 颜色: '颜色与外观', 身体部位: '身体与医疗', 看病健康: '身体与医疗',
  喜怒哀乐: '情绪与态度', 同意反对: '情绪与态度', 担心满意: '情绪与态度', 家庭: '家庭与人物',
  职业: '职业与身份', 人际关系: '家庭与人物', 社交礼貌: '日常与交流', 风景: '旅行与景观',
  地名属地: '旅行与景观', 动物植物: '天气与自然', 常用名词: '日常与交流', 常用动词: '日常与交流',
  常用副词: '日常与交流', 常用形容词: '颜色与外观', 常用介词连词: '理由与逻辑',
  生意: '生意与购物', 商业: '商业与公司', 银行: '银行与金融', 住所: '租房与居家', 服饰: '服饰与穿搭',
};

export function normalizeScenarioCategory(category: string): string {
  return (scenarioCategories as readonly string[]).includes(category as never)
    ? category
    : legacyCategoryMap[category] ?? '日常与交流';
}

export function scenarioCategoryForVocabulary(category: string): string {
  return normalizeScenarioCategory(category);
}
