import { topicPractices, type TopicPracticeLine } from './topicPractice';

export type DialogueLine = TopicPracticeLine;

export interface Dialogue {
  category: string;
  icon: string;
  title: string;
  scenario: string;
  level: 1 | 2 | 3;
  lines: DialogueLine[];
}

export const dialogues: Dialogue[] = topicPractices.map(topic => ({ ...topic }));
