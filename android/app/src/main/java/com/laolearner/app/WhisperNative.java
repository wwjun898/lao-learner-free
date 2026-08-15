package com.laolearner.app;

import android.content.res.AssetManager;

final class WhisperNative {
    static {
        System.loadLibrary("offline_whisper");
    }

    private WhisperNative() {}

    static native long initContextFromAsset(AssetManager assetManager, String assetPath);
    static native void freeContext(long contextPtr);
    static native int fullTranscribe(long contextPtr, int numThreads, float[] audioData, String language);
    static native int getTextSegmentCount(long contextPtr);
    static native String getTextSegment(long contextPtr, int index);
}
