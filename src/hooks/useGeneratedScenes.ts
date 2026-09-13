import { useEffect, useState } from 'react';
import type { GeneratedScene } from '../lib/sceneGeneration';
import { renameIndustryCategory } from '../data/industryCategory';

export interface SavedScene extends GeneratedScene { id: string; words: string[]; createdAt: string }
const key = 'lao-learner-generated-scenes-v1';
const eventName = 'lao-generated-scenes-changed';
function load(): SavedScene[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('场景练习数据无法读取');
  return value.map((scene: SavedScene) => ({ ...scene, category: renameIndustryCategory(scene.category) }));
}
export function useGeneratedScenes() {
  const [scenes, setScenes] = useState(load);
  useEffect(() => {
    const sync = () => setScenes(load());
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(eventName, sync); window.removeEventListener('storage', sync); };
  }, []);
  function save(scene: GeneratedScene, words: string[]) {
    const entry = { ...scene, category: renameIndustryCategory(scene.category), words, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const next = [...load(), entry];
    localStorage.setItem(key, JSON.stringify(next));
    setScenes(next);
    window.dispatchEvent(new Event(eventName));
    return entry;
  }
  function updateCategory(id: string, category: string) {
    const current = load();
    const entry = current.find(scene => scene.id === id);
    if (!entry) throw new Error('未找到生成的场景，请重新生成');
    const updated = { ...entry, category: renameIndustryCategory(category) };
    const next = current.map(scene => scene.id === id ? updated : scene);
    localStorage.setItem(key, JSON.stringify(next));
    setScenes(next);
    window.dispatchEvent(new Event(eventName));
    return updated;
  }
  return { scenes, save, updateCategory };
}
