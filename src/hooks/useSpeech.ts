import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition as NativeSpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { hasNativeGeminiConfig, synthesizeLaoAudio, transcribeLaoAudio } from '../lib/ai';
import { OfflineWhisper } from '../lib/offlineWhisper';
import { laoTextSimilarity, normalizeRecognizedLao } from '../lib/laoSpeechNormalization';
import audioMap from '../audio-map.json';

// Pre-generated audio paths for Lao text
const laoAudioMap: Record<string, { normal: string; slow: string }> = audioMap as any;

// GitHub Pages 子路径：运行时拼接 base
const base = import.meta.env.BASE_URL || '/';

export type MicrophoneStatus = 'idle' | 'testing' | 'ready' | 'error';

function microphoneErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError') {
    return '麦克风权限被拒绝。请在 Chrome 地址栏左侧的网站设置中将麦克风改为“允许”，然后刷新页面。';
  }
  if (name === 'NotFoundError') return '没有检测到可用麦克风，请检查设备连接。';
  if (name === 'NotReadableError') return '麦克风无法读取，可能被其他程序占用，或被 Windows 隐私设置禁止。';
  return '无法获取麦克风，请检查浏览器和 Windows 麦克风设置。';
}

async function requestMicrophone(): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw new Error('麦克风只能在 HTTPS 或本机 127.0.0.1 地址中使用。');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器容器没有开放麦克风功能。请使用 Chrome 打开本应用。');
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new Error(microphoneErrorMessage(error), { cause: error });
  }
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const [listeningError, setListeningError] = useState('');
  const [recognitionStatus, setRecognitionStatus] = useState('');
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dynamicAudioUrlRef = useRef('');
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const levelFrameRef = useRef<number | null>(null);
  const recognitionTimeoutRef = useRef<number | null>(null);
  const transcriptRef = useRef('');
  const recognitionErrorRef = useRef(false);
  const nativeRecognitionActiveRef = useRef(false);
  const nativeListenerRemoversRef = useRef<Array<() => Promise<void>>>([]);
  const geminiRecordingActiveRef = useRef(false);
  const recordingCompleteRef = useRef<((audio: Blob) => void) | null>(null);
  const offlineRecordingActiveRef = useRef(false);
  const offlineProcessingRef = useRef(false);
  const offlineLevelListenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  // 初始化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    synthRef.current = window.speechSynthesis;
    audioRef.current = new Audio();
    
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      voicesRef.current = v;
      if (v.length > 0) setReady(true);
    };
    
    // Chrome 需要等 voiceschanged 事件
    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);
    
    // 强制触发加载
    if (synthRef.current) {
      const u = new SpeechSynthesisUtterance('');
      synthRef.current.speak(u);
      synthRef.current.cancel();
    }
    
    // Audio 事件
    const audio = audioRef.current;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    
    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
      if (dynamicAudioUrlRef.current) URL.revokeObjectURL(dynamicAudioUrlRef.current);
    };
  }, []);

  // 找最佳语音（非老挝语时使用）
  const findBestVoice = useCallback((targetLang: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current;
    if (voices.length === 0) return null;
    
    const langPrefix = targetLang.split('-')[0];
    
    let v = voices.find(x => x.lang === targetLang);
    if (v) return v;
    
    v = voices.find(x => x.lang.startsWith(langPrefix));
    if (v) return v;
    
    if (langPrefix === 'lo') {
      v = voices.find(x => x.lang.startsWith('th'));
      if (v) return v;
    }
    
    v = voices.find(x => x.lang.startsWith('zh'));
    if (v) return v;
    
    v = voices.find(x => x.lang.startsWith('en'));
    return v || voices[0] || null;
  }, []);

  // 播放预生成的音频文件
  const playAudioFile = useCallback((src: string, rate: number = 1) => {
    const audio = audioRef.current;
    if (!audio) return false;
    
    // 停止之前的播放
    audio.pause();
    audio.currentTime = 0;
    synthRef.current?.cancel();
    
    // 拼接 Vite base 路径（兼容 GitHub Pages 子路径部署）
    const fullSrc = base + src.replace(/^\//, '');
    audio.src = fullSrc;
    audio.playbackRate = rate;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    audio.play().then(() => {
      setIsSpeaking(true);
    }).catch((e) => {
      console.error('音频播放失败:', fullSrc, e);
      setIsSpeaking(false);
    });
    return true;
  }, []);

  // 顺序播放多个音频片段
  const playAudioSequence = useCallback((srcs: string[], rate: number = 1) => {
    const audio = audioRef.current;
    if (!audio || srcs.length === 0) return false;

    audio.pause();
    audio.currentTime = 0;
    synthRef.current?.cancel();

    let index = 0;
    const playNext = () => {
      if (index >= srcs.length) {
        setIsSpeaking(false);
        return;
      }
      const fullSrc = base + srcs[index].replace(/^\//, '');
      audio.src = fullSrc;
      audio.playbackRate = rate;
      audio.play().catch(() => {
        // 跳过失败的片段，继续下一个
        index++;
        playNext();
      });
    };

    audio.onended = () => {
      index++;
      playNext();
    };

    setIsSpeaking(true);
    playNext();
    return true;
  }, []);

  // 停止播放
  const stopAll = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = () => setIsSpeaking(false); // 重置 onended
    }
    synthRef.current?.cancel();
    if (Capacitor.isNativePlatform()) void TextToSpeech.stop();
    setIsSpeaking(false);
  }, []);

  // 非老挝语的 Web Speech API 朗读
  const speakText = useCallback((text: string, lang: string, rate = 0.9) => {
    if (Capacitor.isNativePlatform()) {
      setIsSpeaking(true);
      void TextToSpeech.speak({
        text,
        lang: lang === 'zh' ? 'zh-CN' : lang === 'th' ? 'th-TH' : lang === 'lo' ? 'lo-LA' : lang,
        rate,
        pitch: 1,
        volume: 1,
      }).catch(error => {
        console.error('手机系统朗读失败:', error);
        alert(lang === 'lo' ? '手机未安装老挝语语音。请在系统“文字转语音”设置中安装老挝语语音包。' : '手机系统朗读失败');
      }).finally(() => setIsSpeaking(false));
      return;
    }
    const synth = synthRef.current;
    if (!synth) {
      alert('浏览器不支持语音合成');
      return;
    }
    
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (lang === 'th') {
      utterance.lang = 'th-TH';
    } else if (lang === 'zh') {
      utterance.lang = 'zh-CN';
    } else {
      utterance.lang = lang;
    }
    
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voice = findBestVoice(utterance.lang);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('朗读错误:', e.error);
      setIsSpeaking(false);
    };
    
    synth.speak(utterance);
  }, [findBestVoice]);

  // 未收录的老挝语由在线 TTS 动态合成，成功后会缓存在本机。
  const playDynamicLao = useCallback((text: string, rate: number, slow = false) => {
    if (Capacitor.isNativePlatform()) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      setIsSpeaking(true);
      void synthesizeLaoAudio(text, slow).then(blob => {
        if (dynamicAudioUrlRef.current) URL.revokeObjectURL(dynamicAudioUrlRef.current);
        dynamicAudioUrlRef.current = URL.createObjectURL(blob);
        audio.src = dynamicAudioUrlRef.current;
        audio.playbackRate = rate;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        return audio.play();
      }).catch(error => {
        console.error('动态老挝语音频生成失败:', error);
        setIsSpeaking(false);
        alert(error instanceof Error ? error.message : '新增词在线发音失败，请检查网络和 Google API Key');
      });
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      speakText(text, 'lo', slow ? 0.65 : Math.min(rate, 1));
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    synthRef.current?.cancel();

    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      setIsSpeaking(false);
      speakText(text, 'lo', slow ? 0.65 : Math.min(rate, 1));
    };

    audio.src = `/api/tts?text=${encodeURIComponent(text)}&mode=${slow ? 'slow' : 'normal'}`;
    audio.playbackRate = rate;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = fallback;
    setIsSpeaking(true);
    audio.play().catch(fallback);
  }, [speakText]);

  // 老挝语（使用预生成音频）
  const speakLao = useCallback((text: string, rate: number = 1) => {
    const entry = laoAudioMap[text];
    if (entry?.normal) {
      playAudioFile(entry.normal, rate);
    } else {
      // 尝试按空格拆分为多个词顺序播放
      const words = text.split(/\s+/).filter(Boolean);
      const srcs = words.map(w => laoAudioMap[w]?.normal).filter(Boolean) as string[];
      if (srcs.length === words.length && srcs.length > 0) {
        playAudioSequence(srcs, rate);
      } else {
        playDynamicLao(text, rate);
      }
    }
  }, [playAudioFile, playAudioSequence, playDynamicLao]);

  // 中文（Web Speech API）
  const speakChinese = useCallback((text: string) => {
    speakText(text, 'zh');
  }, [speakText]);

  // 慢速老挝语（使用预生成音频）
  const speakSlow = useCallback((text: string, rate: number = 1) => {
    const entry = laoAudioMap[text];
    if (entry?.slow) {
      playAudioFile(entry.slow, rate);
    } else {
      const words = text.split(/\s+/).filter(Boolean);
      const srcs = words.map(w => laoAudioMap[w]?.slow).filter(Boolean) as string[];
      if (srcs.length === words.length && srcs.length > 0) {
        playAudioSequence(srcs, rate);
      } else {
        playDynamicLao(text, rate, true);
      }
    }
  }, [playAudioFile, playAudioSequence, playDynamicLao]);

  // 通用
  const speak = useCallback((text: string, lang: string) => {
    if (lang === 'lo') {
      speakLao(text);
    } else {
      speakText(text, lang);
    }
  }, [speakLao, speakText]);

  // 停止
  const stopSpeaking = useCallback(() => {
    stopAll();
  }, [stopAll]);

  const testMicrophone = useCallback(async () => {
    setListeningError('');
    setMicrophoneStatus('testing');
    try {
      const stream = await requestMicrophone();
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneStatus('ready');
      return true;
    } catch (error) {
      setListeningError(error instanceof Error ? error.message : '麦克风测试失败。');
      setMicrophoneStatus('error');
      return false;
    }
  }, []);

  const stopMicrophoneCapture = useCallback(() => {
    if (recognitionTimeoutRef.current !== null) {
      window.clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    if (levelFrameRef.current !== null) {
      cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    microphoneStreamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setInputLevel(0);
  }, []);

  const startMicrophoneCapture = useCallback((stream: MediaStream) => {
    microphoneStreamRef.current = stream;

    if (typeof MediaRecorder !== 'undefined') {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const recording = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setRecordedAudioUrl(previous => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(recording);
        });
        recordingCompleteRef.current?.(recording);
        recordingCompleteRef.current = null;
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    }

    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    void context.resume();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const samples = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        sum += normalized * normalized;
      }
      setInputLevel(Math.min(1, Math.sqrt(sum / samples.length) * 5));
      levelFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }, []);

  const clearRecognitionTimeout = useCallback(() => {
    if (recognitionTimeoutRef.current !== null) {
      window.clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
  }, []);

  const setRecordedWave = useCallback((audioBase64: string) => {
    const binary = window.atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    setRecordedAudioUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
  }, []);

  const finishOfflineRecognition = useCallback(async () => {
    if (!offlineRecordingActiveRef.current || offlineProcessingRef.current) return;
    offlineRecordingActiveRef.current = false;
    offlineProcessingRef.current = true;
    clearRecognitionTimeout();
    setIsListening(false);
    setInputLevel(0);
    setRecognitionStatus('离线模型正在识别，请稍候...');
    await offlineLevelListenerRef.current?.remove().catch(() => undefined);
    offlineLevelListenerRef.current = null;

    try {
      const result = await OfflineWhisper.stopAndTranscribe();
      setRecordedWave(result.audioBase64);
      const recognized = normalizeRecognizedLao(result.text);
      if (!recognized) {
        recognitionErrorRef.current = true;
        setListeningError('离线模型没有识别到文字，请靠近麦克风并放慢速度重试。');
      } else {
        transcriptRef.current = recognized;
        setTranscript(recognized);
        setListeningError('');
      }
    } catch (error) {
      recognitionErrorRef.current = true;
      setListeningError(error instanceof Error ? error.message : '离线老挝语识别失败，请重试。');
    } finally {
      offlineProcessingRef.current = false;
      setRecognitionStatus('');
    }
  }, [clearRecognitionTimeout, setRecordedWave]);

  const startOfflineRecognition = useCallback(async () => {
    transcriptRef.current = '';
    recognitionErrorRef.current = false;
    setTranscript('');
    setListeningError('');
    setRecognitionStatus('');
    setRecordedAudioUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });

    const status = await OfflineWhisper.getStatus();
    if (!status.available) throw new Error('离线老挝语模型不可用');
    await offlineLevelListenerRef.current?.remove().catch(() => undefined);
    offlineLevelListenerRef.current = await OfflineWhisper.addListener('audioLevel', event => {
      setInputLevel(Math.max(0, Math.min(1, event.value)));
    });
    await OfflineWhisper.startRecording();
    offlineRecordingActiveRef.current = true;
    setMicrophoneStatus('ready');
    setIsListening(true);
    recognitionTimeoutRef.current = window.setTimeout(() => {
      void finishOfflineRecognition();
    }, 10_000);
    return true;
  }, [finishOfflineRecognition]);

  const removeNativeRecognitionListeners = useCallback(async () => {
    const removers = nativeListenerRemoversRef.current.splice(0);
    await Promise.allSettled(removers.map(remove => remove()));
  }, []);

  const nativeRecognitionErrorMessage = useCallback((code: string, fallback?: string) => {
    const messages: Record<string, string> = {
      '1': '系统语音识别连接超时，请检查网络后重试。',
      '2': '系统语音识别网络连接失败，请检查手机网络或语音服务。',
      '3': '系统无法读取麦克风声音，请关闭占用麦克风的其他应用。',
      '4': '系统语音识别服务器暂时不可用，请稍后重试。',
      '5': '系统语音识别已中断，请重新开始跟读。',
      '6': '没有检测到语音，请靠近麦克风并清晰朗读。',
      '7': '没有识别到匹配文字，请放慢速度后重试。',
      '8': '系统语音识别正忙，请稍等几秒后重试。',
      '9': '麦克风权限未授权，请在手机应用权限中允许麦克风。',
      '12': '手机语音服务不支持老挝语（lo-LA）。请安装或更新系统语音识别服务。',
      '13': '手机尚未下载老挝语识别模型，请在系统语音设置中安装后重试。',
      network: '系统语音识别网络连接失败，请检查手机网络或语音服务。',
      'no-match': '没有识别到匹配文字，请放慢速度后重试。',
      'no-speech': '没有检测到语音，请靠近麦克风并清晰朗读。',
      'language-not-supported': '手机语音服务不支持老挝语（lo-LA）。请安装或更新系统语音识别服务。',
      'language-unavailable': '手机尚未下载老挝语识别模型，请在系统语音设置中安装后重试。',
    };
    return messages[code] ?? fallback ?? `系统语音识别失败（${code}）`;
  }, []);

  const finishNativeRecognition = useCallback(async (errorMessage = '') => {
    clearRecognitionTimeout();
    nativeRecognitionActiveRef.current = false;
    setIsListening(false);
    if (errorMessage) {
      recognitionErrorRef.current = true;
      setListeningError(errorMessage);
    } else if (!transcriptRef.current && !recognitionErrorRef.current) {
      setListeningError('录音已完成，但系统没有识别到老挝语文字。请确认手机已安装老挝语识别服务，并放慢速度重试。');
    }
    await removeNativeRecognitionListeners();
  }, [clearRecognitionTimeout, removeNativeRecognitionListeners]);

  const startNativeRecognition = useCallback(async () => {
    transcriptRef.current = '';
    recognitionErrorRef.current = false;
    setTranscript('');
    setRecordedAudioUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });

    let permission = await NativeSpeechRecognition.checkPermissions();
    if (permission.speechRecognition !== 'granted') {
      permission = await NativeSpeechRecognition.requestPermissions();
    }
    if (permission.speechRecognition !== 'granted') {
      setMicrophoneStatus('error');
      setListeningError('麦克风权限未授权，请在手机应用权限中允许麦克风。');
      return false;
    }

    const { available } = await NativeSpeechRecognition.available();
    if (!available) {
      setListeningError('这台手机没有可用的系统语音识别服务。请安装或启用 Google 应用、系统语音助手或其他语音识别服务。');
      return false;
    }

    const onDevice = await NativeSpeechRecognition
      .isOnDeviceRecognitionAvailable({ language: 'lo-LA' })
      .then(result => result.available)
      .catch(() => false);

    await removeNativeRecognitionListeners();
    const partialListener = await NativeSpeechRecognition.addListener('partialResults', event => {
      const nextTranscript = event.accumulatedText || event.matches?.[0] || event.accumulated || '';
      if (!nextTranscript) return;
      transcriptRef.current = nextTranscript;
      setTranscript(nextTranscript);
    });
    const errorListener = await NativeSpeechRecognition.addListener('error', event => {
      console.error('原生识别错误:', event.code, event.message);
      void finishNativeRecognition(nativeRecognitionErrorMessage(event.code, event.message));
    });
    const stateListener = await NativeSpeechRecognition.addListener('listeningState', event => {
      const stopped = event.status === 'stopped' || event.state === 'stopped';
      if (stopped && nativeRecognitionActiveRef.current && event.reason !== 'error') {
        window.setTimeout(() => void finishNativeRecognition(), 150);
      }
    });
    nativeListenerRemoversRef.current = [
      () => partialListener.remove(),
      () => errorListener.remove(),
      () => stateListener.remove(),
    ];

    setMicrophoneStatus('ready');
    setIsListening(true);
    nativeRecognitionActiveRef.current = true;
    recognitionTimeoutRef.current = window.setTimeout(() => {
      void NativeSpeechRecognition.forceStop({ timeout: 1200 });
    }, 10_000);

    const result = await NativeSpeechRecognition.start({
      language: 'lo-LA',
      maxResults: 3,
      popup: false,
      partialResults: true,
      useOnDeviceRecognition: onDevice,
      allowForSilence: 1800,
      muteRecognizerBeep: false,
    });
    const immediateTranscript = result.matches?.[0];
    if (immediateTranscript) {
      transcriptRef.current = immediateTranscript;
      setTranscript(immediateTranscript);
    }
    return true;
  }, [finishNativeRecognition, nativeRecognitionErrorMessage, removeNativeRecognitionListeners]);

  const startGeminiRecognition = useCallback(async () => {
    transcriptRef.current = '';
    recognitionErrorRef.current = false;
    setTranscript('');
    setRecordedAudioUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });

    const stream = await requestMicrophone();
    setMicrophoneStatus('ready');
    geminiRecordingActiveRef.current = true;
    setIsListening(true);

    const recordingCompleted = new Promise<Blob>(resolve => {
      recordingCompleteRef.current = resolve;
    });
    startMicrophoneCapture(stream);
    recognitionTimeoutRef.current = window.setTimeout(() => stopMicrophoneCapture(), 10_000);

    void recordingCompleted.then(async recording => {
      clearRecognitionTimeout();
      geminiRecordingActiveRef.current = false;
      setIsListening(false);
      setListeningError('Gemini正在识别录音，请稍候...');
      try {
        const recognized = await transcribeLaoAudio(recording);
        transcriptRef.current = recognized;
        setTranscript(recognized);
        setListeningError('');
      } catch (error) {
        recognitionErrorRef.current = true;
        setListeningError(error instanceof Error ? error.message : 'Gemini语音识别失败，请稍后重试');
      }
    });
    return true;
  }, [clearRecognitionTimeout, startMicrophoneCapture, stopMicrophoneCapture]);

  // 语音识别
  const startListening = useCallback(async () => {
    setListeningError('');
    setRecognitionStatus('');
    if (Capacitor.isNativePlatform()) {
      try {
        return await startOfflineRecognition();
      } catch (error) {
        console.error('离线语音识别启动失败，尝试备用引擎:', error);
        nativeRecognitionActiveRef.current = false;
        setIsListening(false);
        await removeNativeRecognitionListeners();
        try {
          if (hasNativeGeminiConfig()) return await startGeminiRecognition();
          return await startNativeRecognition();
        } catch (fallbackError) {
          setListeningError(fallbackError instanceof Error ? fallbackError.message : '语音识别启动失败，请稍后重试。');
          return false;
        }
      }
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setListeningError('当前浏览器不支持语音识别。请在 Chrome 中打开本应用。');
      return false;
    }

    try {
      const stream = await requestMicrophone();
      startMicrophoneCapture(stream);
      setMicrophoneStatus('ready');
    } catch (error) {
      setListeningError(error instanceof Error ? error.message : '无法获取麦克风权限。');
      setMicrophoneStatus('error');
      return false;
    }

    try {
      transcriptRef.current = '';
      recognitionErrorRef.current = false;
      setTranscript('');
      setRecordedAudioUrl(previous => {
        if (previous) URL.revokeObjectURL(previous);
        return '';
      });
      const recognition = new SR();
      recognition.lang = 'lo-LA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        recognitionTimeoutRef.current = window.setTimeout(() => {
          try { recognition.stop(); } catch { /* Already stopped. */ }
        }, 10_000);
      };

      recognition.onresult = (event: any) => {
        let finalT = '', interimT = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalT += event.results[i][0].transcript;
          } else {
            interimT += event.results[i][0].transcript;
          }
        }
        const nextTranscript = finalT || interimT;
        transcriptRef.current = nextTranscript;
        setTranscript(nextTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('识别错误:', event.error);
        recognitionErrorRef.current = true;
        const messages: Record<string, string> = {
          'not-allowed': '麦克风权限被拒绝，请在 Chrome 网站设置中允许麦克风。',
          'service-not-allowed': '浏览器禁止使用在线语音识别服务。',
          'audio-capture': '无法采集麦克风声音，请检查 Windows 输入设备。',
          'network': '在线语音识别服务连接失败，请检查当前网络和浏览器语音服务。',
          'no-speech': '没有检测到语音，请靠近麦克风后重试。',
          'language-not-supported': '当前浏览器的语音识别服务不支持老挝语。',
        };
        setListeningError(messages[event.error] ?? `语音识别失败：${event.error}`);
        setIsListening(false);
        stopMicrophoneCapture();
      };

      recognition.onend = () => {
        setIsListening(false);
        stopMicrophoneCapture();
        if (!transcriptRef.current && !recognitionErrorRef.current) {
          setListeningError('录音已完成，但浏览器语音识别没有返回文字。您可以先回听录音，并确认浏览器支持老挝语识别。');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (e) {
      console.error('启动失败:', e);
      setListeningError('语音识别启动失败，请刷新页面后重试。');
      stopMicrophoneCapture();
      return false;
    }
  }, [removeNativeRecognitionListeners, startGeminiRecognition, startMicrophoneCapture, startNativeRecognition, startOfflineRecognition, stopMicrophoneCapture]);

  const stopListening = useCallback(() => {
    if (Capacitor.isNativePlatform() && offlineRecordingActiveRef.current) {
      void finishOfflineRecognition();
      return;
    }
    if (Capacitor.isNativePlatform() && geminiRecordingActiveRef.current) {
      stopMicrophoneCapture();
      return;
    }
    if (Capacitor.isNativePlatform() && nativeRecognitionActiveRef.current) {
      void NativeSpeechRecognition.forceStop({ timeout: 1200 });
      return;
    }
    try { recognitionRef.current?.stop(); } catch { /* Already stopped. */ }
    stopMicrophoneCapture();
  }, [finishOfflineRecognition, stopMicrophoneCapture]);

  const compareText = useCallback((target: string, spoken: string): number => {
    return laoTextSimilarity(target, spoken);
  }, []);

  return {
    isListening, transcript, isSpeaking, ready, listeningError, recognitionStatus, microphoneStatus,
    inputLevel, recordedAudioUrl,
    speakLao, speakChinese, speakSlow, speak,
    stopSpeaking, testMicrophone, startListening, stopListening, compareText,
  };
}
