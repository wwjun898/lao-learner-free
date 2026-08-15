package com.laolearner.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.util.Log;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

@RunWith(AndroidJUnit4.class)
public class OfflineWhisperInstrumentedTest {
    private static final String TAG = "OfflineWhisperTest";

    @Test
    public void transcribesBundledLaoSampleWithoutNetwork() throws Exception {
        Context target = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Context testContext = InstrumentationRegistry.getInstrumentation().getContext();
        DecodedAudio audio = decodeMp3(testContext, "test-audio/thanks.mp3");
        float[] samples = resampleTo16KhzMono(audio);

        long context = WhisperNative.initContextFromAsset(
            target.getAssets(),
            "models/ggml-base-q5_1.bin"
        );
        assertTrue("Whisper model should load", context != 0);
        try {
            int code = WhisperNative.fullTranscribe(context, 4, samples, "lo");
            assertTrue("Whisper inference should succeed", code == 0);
            StringBuilder result = new StringBuilder();
            int count = WhisperNative.getTextSegmentCount(context);
            for (int index = 0; index < count; index++) {
                result.append(WhisperNative.getTextSegment(context, index));
            }
            String text = OfflineWhisperPlugin.normalizeLaoScript(result.toString().trim());
            Log.i(TAG, "OFFLINE_TRANSCRIPT=" + text);
            assertFalse("Transcript should not be empty", text.isEmpty());
            assertTrue("Transcript should contain Lao characters", text.matches(".*[\\u0E80-\\u0EFF].*"));
        } finally {
            WhisperNative.freeContext(context);
        }
    }

    private static DecodedAudio decodeMp3(Context context, String assetPath) throws Exception {
        MediaExtractor extractor = new MediaExtractor();
        try (AssetFileDescriptor descriptor = context.getAssets().openFd(assetPath)) {
            extractor.setDataSource(
                descriptor.getFileDescriptor(),
                descriptor.getStartOffset(),
                descriptor.getLength()
            );
        }

        int track = -1;
        MediaFormat format = null;
        for (int index = 0; index < extractor.getTrackCount(); index++) {
            MediaFormat candidate = extractor.getTrackFormat(index);
            String mime = candidate.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("audio/")) {
                track = index;
                format = candidate;
                break;
            }
        }
        if (track < 0 || format == null) throw new IllegalStateException("No audio track");
        extractor.selectTrack(track);

        String mime = format.getString(MediaFormat.KEY_MIME);
        int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
        int channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
        MediaCodec codec = MediaCodec.createDecoderByType(mime);
        ByteArrayOutputStream pcm = new ByteArrayOutputStream();
        try {
            codec.configure(format, null, null, 0);
            codec.start();
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            boolean inputDone = false;
            boolean outputDone = false;
            while (!outputDone) {
                if (!inputDone) {
                    int inputIndex = codec.dequeueInputBuffer(10_000);
                    if (inputIndex >= 0) {
                        ByteBuffer input = codec.getInputBuffer(inputIndex);
                        int size = extractor.readSampleData(input, 0);
                        if (size < 0) {
                            codec.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            inputDone = true;
                        } else {
                            codec.queueInputBuffer(inputIndex, 0, size, extractor.getSampleTime(), 0);
                            extractor.advance();
                        }
                    }
                }
                int outputIndex = codec.dequeueOutputBuffer(info, 10_000);
                if (outputIndex >= 0) {
                    ByteBuffer output = codec.getOutputBuffer(outputIndex);
                    if (info.size > 0 && output != null) {
                        byte[] chunk = new byte[info.size];
                        output.position(info.offset);
                        output.limit(info.offset + info.size);
                        output.get(chunk);
                        pcm.write(chunk);
                    }
                    outputDone = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                    codec.releaseOutputBuffer(outputIndex, false);
                }
            }
        } finally {
            codec.stop();
            codec.release();
            extractor.release();
        }
        return new DecodedAudio(pcm.toByteArray(), sampleRate, channels);
    }

    private static float[] resampleTo16KhzMono(DecodedAudio audio) {
        ByteBuffer pcm = ByteBuffer.wrap(audio.bytes).order(ByteOrder.LITTLE_ENDIAN);
        int frameCount = audio.bytes.length / 2 / audio.channels;
        float[] mono = new float[frameCount];
        for (int frame = 0; frame < frameCount; frame++) {
            float sum = 0;
            for (int channel = 0; channel < audio.channels; channel++) {
                sum += pcm.getShort() / 32768f;
            }
            mono[frame] = sum / audio.channels;
        }
        int outputCount = Math.max(1, Math.round(frameCount * 16000f / audio.sampleRate));
        float[] output = new float[outputCount];
        for (int index = 0; index < outputCount; index++) {
            float source = index * audio.sampleRate / 16000f;
            int left = Math.min((int) source, frameCount - 1);
            int right = Math.min(left + 1, frameCount - 1);
            float fraction = source - left;
            output[index] = mono[left] * (1 - fraction) + mono[right] * fraction;
        }
        return output;
    }

    private static final class DecodedAudio {
        final byte[] bytes;
        final int sampleRate;
        final int channels;

        DecodedAudio(byte[] bytes, int sampleRate, int channels) {
            this.bytes = bytes;
            this.sampleRate = sampleRate;
            this.channels = channels;
        }
    }
}
