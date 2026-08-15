import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laolearner.app',
  appName: '老挝语口语学习',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f5f6f8',
  },
};

export default config;
