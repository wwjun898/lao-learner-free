package com.laolearner.app;

import android.Manifest;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "OfflineWhisper",
    permissions = @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
)
public class OfflineWhisperPlugin extends Plugin {
    private static final String MODEL_ASSET = "models/ggml-base-q5_1.bin";

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private PcmRecorder recorder;
    private long whisperContext;

    void emitAudioLevel(JSObject level) {
        notifyListeners("audioLevel", level);
    }

    @PluginMethod
    public synchronized void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("model", "Whisper base-q5_1");
        result.put("offline", true);
        call.resolve(result);
    }

    @PluginMethod
    public synchronized void startRecording(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
            return;
        }
        beginRecording(call);
    }

    @PermissionCallback
    private synchronized void microphonePermissionCallback(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("麦克风权限未授权，请在系统应用权限中允许麦克风。");
            return;
        }
        beginRecording(call);
    }

    private void beginRecording(PluginCall call) {
        if (recorder != null && recorder.isAlive()) {
            call.reject("录音已经开始");
            return;
        }
        recorder = new PcmRecorder(this);
        recorder.start();
        call.resolve();
    }

    @PluginMethod
    public synchronized void stopAndTranscribe(PluginCall call) {
        PcmRecorder current = recorder;
        recorder = null;
        if (current == null) {
            call.reject("没有正在进行的录音");
            return;
        }

        worker.execute(() -> {
            try {
                float[] samples = current.finishAndGetSamples();
                if (samples.length < 4000) {
                    throw new IllegalStateException("录音太短，请按下按钮后完整读一遍。");
                }
                long context = getWhisperContext();
                int threads = Math.max(2, Math.min(6, Runtime.getRuntime().availableProcessors() - 2));
                int code = WhisperNative.fullTranscribe(context, threads, samples, "lo");
                if (code != 0) throw new IllegalStateException("离线模型识别失败，错误码：" + code);

                StringBuilder text = new StringBuilder();
                int segmentCount = WhisperNative.getTextSegmentCount(context);
                for (int i = 0; i < segmentCount; i++) {
                    text.append(WhisperNative.getTextSegment(context, i));
                }

                JSObject result = new JSObject();
                result.put("text", normalizeLaoScript(text.toString().trim()));
                result.put("audioBase64", Base64.encodeToString(current.getWaveBytes(), Base64.NO_WRAP));
                result.put("durationMs", samples.length * 1000L / 16000L);
                result.put("engine", "offline-whisper");
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "离线语音识别失败" : error.getMessage(), error);
            }
        });
    }

    @PluginMethod
    public synchronized void cancelRecording(PluginCall call) {
        if (recorder != null) {
            recorder.requestStop();
            recorder = null;
        }
        call.resolve();
    }

    private synchronized long getWhisperContext() {
        if (whisperContext == 0) {
            whisperContext = WhisperNative.initContextFromAsset(getContext().getAssets(), MODEL_ASSET);
            if (whisperContext == 0) throw new IllegalStateException("无法加载离线老挝语模型");
        }
        return whisperContext;
    }

    static String normalizeLaoScript(String text) {
        String thai = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะัาำิีึืุูเแโใไๅ็่้๊๋์ๆฯ";
        String[] lao = {
            "ກ", "ຂ", "ຂ", "ຄ", "ຄ", "ຄ", "ງ", "ຈ", "ສ", "ຊ", "ຊ", "ຊ", "ຍ",
            "ດ", "ຕ", "ຖ", "ທ", "ທ", "ນ", "ດ", "ຕ", "ຖ", "ທ", "ທ", "ນ", "ບ", "ປ",
            "ຜ", "ຝ", "ພ", "ຟ", "ພ", "ມ", "ຍ", "ຣ", "ລ", "ວ", "ສ", "ສ", "ສ", "ຫ",
            "ລ", "ອ", "ຮ", "ະ", "ັ", "າ", "ຳ", "ິ", "ີ", "ຶ", "ື", "ຸ", "ູ", "ເ", "ແ",
            "ໂ", "ໃ", "ໄ", "າ", "", "່", "້", "໊", "໋", "໌", "ໆ", "ຯ"
        };
        StringBuilder normalized = new StringBuilder();
        for (int offset = 0; offset < text.length();) {
            int codePoint = text.codePointAt(offset);
            offset += Character.charCount(codePoint);
            int index = thai.indexOf(codePoint);
            normalized.append(index >= 0 ? lao[index] : new String(Character.toChars(codePoint)));
        }
        return normalized.toString();
    }

    @Override
    protected synchronized void handleOnDestroy() {
        if (recorder != null) recorder.requestStop();
        recorder = null;
        if (whisperContext != 0) WhisperNative.freeContext(whisperContext);
        whisperContext = 0;
        worker.shutdownNow();
        super.handleOnDestroy();
    }
}
