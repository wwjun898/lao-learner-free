package com.laolearner.app;

import android.annotation.SuppressLint;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;

import com.getcapacitor.JSObject;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.atomic.AtomicBoolean;

final class PcmRecorder extends Thread {
    private static final int SAMPLE_RATE = 16000;

    private final OfflineWhisperPlugin plugin;
    private final AtomicBoolean stopping = new AtomicBoolean(false);
    private final ByteArrayOutputStream pcm = new ByteArrayOutputStream();
    private volatile RuntimeException failure;

    PcmRecorder(OfflineWhisperPlugin plugin) {
        super("LaoWhisperRecorder");
        this.plugin = plugin;
    }

    @SuppressLint("MissingPermission")
    @Override
    public void run() {
        int minimum = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        );
        int bufferSize = Math.max(minimum * 2, 4096);
        short[] samples = new short[bufferSize / 2];
        AudioRecord audioRecord = new AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        );

        try {
            if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                throw new IllegalStateException("麦克风录音初始化失败");
            }
            audioRecord.startRecording();
            while (!stopping.get()) {
                int count = audioRecord.read(samples, 0, samples.length);
                if (count <= 0) continue;
                double sum = 0;
                ByteBuffer bytes = ByteBuffer.allocate(count * 2).order(ByteOrder.LITTLE_ENDIAN);
                for (int i = 0; i < count; i++) {
                    short sample = samples[i];
                    bytes.putShort(sample);
                    double normalized = sample / 32768.0;
                    sum += normalized * normalized;
                }
                pcm.write(bytes.array(), 0, bytes.position());
                JSObject level = new JSObject();
                level.put("value", Math.min(1, Math.sqrt(sum / count) * 5));
                plugin.emitAudioLevel(level);
            }
        } catch (Exception error) {
            failure = new RuntimeException(error.getMessage(), error);
        } finally {
            try {
                if (audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                    audioRecord.stop();
                }
            } catch (Exception ignored) {
                // The recorder may already have been released by Android.
            }
            audioRecord.release();
        }
    }

    void requestStop() {
        stopping.set(true);
    }

    float[] finishAndGetSamples() throws InterruptedException {
        requestStop();
        join(2500);
        if (isAlive()) throw new IllegalStateException("停止录音超时");
        if (failure != null) throw failure;
        byte[] bytes = pcm.toByteArray();
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] samples = new float[bytes.length / 2];
        for (int i = 0; i < samples.length; i++) {
            samples[i] = Math.max(-1f, buffer.getShort() / 32767f);
        }
        return samples;
    }

    byte[] getWaveBytes() {
        byte[] data = pcm.toByteArray();
        ByteBuffer wave = ByteBuffer.allocate(44 + data.length).order(ByteOrder.LITTLE_ENDIAN);
        wave.put(new byte[] { 'R', 'I', 'F', 'F' });
        wave.putInt(36 + data.length);
        wave.put(new byte[] { 'W', 'A', 'V', 'E', 'f', 'm', 't', ' ' });
        wave.putInt(16);
        wave.putShort((short) 1);
        wave.putShort((short) 1);
        wave.putInt(SAMPLE_RATE);
        wave.putInt(SAMPLE_RATE * 2);
        wave.putShort((short) 2);
        wave.putShort((short) 16);
        wave.put(new byte[] { 'd', 'a', 't', 'a' });
        wave.putInt(data.length);
        wave.put(data);
        return wave.array();
    }
}
