# 老挝语口语学习

一款面向中文用户的老挝语口语学习应用，适合在老挝生活、工作、旅行和进行日常交流时使用。应用支持 Web/PWA 和 Android APK 两种运行方式，老挝文字使用 Phetsarath OT 字体。

## 主要功能

- **主题词汇**：数字、货币、时间、日期、度量、形状、颜色、方位、风景、家庭、职业、医疗、人际关系、社交礼貌以及常用词类等。
- **实用对话**：按生活、工作、购物、交通、旅行、医疗、商务等主题整理中老对照对话，支持播放和跟读。
- **场景练习**：按具体使用场景练习常用短句，支持播放、跟读、收藏和重点复习。
- **翻卡复习**：将重点词汇或短语加入翻卡复习，掌握后可直接移出，避免重复出现。
- **AI 解析**：复制老挝语词语或短句后，使用 Google Gemini 获取中文释义、构词分析、用法提示和例句，并可保存到主题词汇或场景练习的指定分类。
- **解析库**：保存 AI 解析结果，支持分类浏览和后续复习。
- **构词法**：整理老挝语常见前缀、构词规律和例词，例词支持发音。
- **数字计算器**：辅助数字、金额和报价场景，并支持老挝语发音。
- **语音功能**：支持老挝语播放、正常语速播放、语音跟读和 Android 语音识别。
- **学习统计**：记录词汇学习、播放、练习和翻卡复习进度。

## 技术栈

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Capacitor 8
- Android SDK / Gradle
- Microsoft Edge TTS（Web 与 Android 新增词在线发音）

## 本地运行

环境要求：Node.js 20 或更高版本，以及 npm 或 pnpm。

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可使用。

生产构建：

```bash
npm run build
```

## AI API 配置

本地词汇、对话、场景练习和已保存内容可以离线使用。只有 AI 深度解析需要 API Key。

复制 `.env.example` 为 `.env.local`，再按实际服务填写配置：

```env
AI_MODE=google
GOOGLE_GEMINI_API_KEY=
PROXY302_API_KEY=
```

不要把 `.env.local`、真实 API Key 或其他密钥提交到 GitHub。API Key 也不建议直接写入 APK 或公开前端代码；公开分发时应使用后端代理并限制额度。

## 构建 Android APK

项目包含 Android Capacitor 工程。Windows 本地构建可以运行：

```bat
build-android.bat
```

成功后会在项目根目录生成 `lao-learner-v1.7.0.apk`。APK 为 debug 安装包，适合测试和内部安装；正式发布时应使用自己的签名密钥生成 release 包。

## 数据存储

用户收藏、重点复习词汇、AI 解析结果和学习统计默认保存在当前设备的本地存储中。清除浏览器或应用数据后，这些内容可能会丢失。

## GitHub Pages

仓库包含 GitHub Actions 部署配置。将项目推送到 `main` 分支后，可以在 GitHub 仓库的 Pages 设置中选择 GitHub Actions 作为发布来源。

## 开发者

开发者：wuzongsheng

## 许可证

MIT License
