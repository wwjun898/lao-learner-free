#include <jni.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <android/log.h>
#include "whisper.h"

#define TAG "LaoOfflineWhisper"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

static size_t asset_read(void *context, void *output, size_t size) {
    return AAsset_read((AAsset *) context, output, size);
}

static bool asset_eof(void *context) {
    return AAsset_getRemainingLength64((AAsset *) context) <= 0;
}

static void asset_close(void *context) {
    AAsset_close((AAsset *) context);
}

JNIEXPORT jlong JNICALL
Java_com_laolearner_app_WhisperNative_initContextFromAsset(
        JNIEnv *env, jclass clazz, jobject asset_manager, jstring asset_path) {
    (void) clazz;
    const char *path = (*env)->GetStringUTFChars(env, asset_path, NULL);
    AAssetManager *manager = AAssetManager_fromJava(env, asset_manager);
    AAsset *asset = AAssetManager_open(manager, path, AASSET_MODE_STREAMING);
    if (asset == NULL) {
        LOGE("Unable to open model asset: %s", path);
        (*env)->ReleaseStringUTFChars(env, asset_path, path);
        return 0;
    }

    struct whisper_model_loader loader = {
        .context = asset,
        .read = asset_read,
        .eof = asset_eof,
        .close = asset_close,
    };
    struct whisper_context_params context_params = whisper_context_default_params();
    context_params.use_gpu = false;
    struct whisper_context *context = whisper_init_with_params(&loader, context_params);
    (*env)->ReleaseStringUTFChars(env, asset_path, path);
    return (jlong) context;
}

JNIEXPORT void JNICALL
Java_com_laolearner_app_WhisperNative_freeContext(
        JNIEnv *env, jclass clazz, jlong context_ptr) {
    (void) env;
    (void) clazz;
    whisper_free((struct whisper_context *) context_ptr);
}

JNIEXPORT jint JNICALL
Java_com_laolearner_app_WhisperNative_fullTranscribe(
        JNIEnv *env, jclass clazz, jlong context_ptr, jint thread_count,
        jfloatArray audio_data, jstring language) {
    (void) clazz;
    struct whisper_context *context = (struct whisper_context *) context_ptr;
    jfloat *samples = (*env)->GetFloatArrayElements(env, audio_data, NULL);
    jsize sample_count = (*env)->GetArrayLength(env, audio_data);
    const char *language_chars = (*env)->GetStringUTFChars(env, language, NULL);

    struct whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.print_realtime = false;
    params.print_progress = false;
    params.print_timestamps = false;
    params.print_special = false;
    params.translate = false;
    params.language = language_chars;
    params.n_threads = thread_count;
    params.no_context = true;
    params.single_segment = true;
    params.suppress_blank = true;
    params.temperature = 0.0f;

    LOGI("Transcribing %d samples with language %s", sample_count, language_chars);
    int result = whisper_full(context, params, samples, sample_count);
    (*env)->ReleaseStringUTFChars(env, language, language_chars);
    (*env)->ReleaseFloatArrayElements(env, audio_data, samples, JNI_ABORT);
    return result;
}

JNIEXPORT jint JNICALL
Java_com_laolearner_app_WhisperNative_getTextSegmentCount(
        JNIEnv *env, jclass clazz, jlong context_ptr) {
    (void) env;
    (void) clazz;
    return whisper_full_n_segments((struct whisper_context *) context_ptr);
}

JNIEXPORT jstring JNICALL
Java_com_laolearner_app_WhisperNative_getTextSegment(
        JNIEnv *env, jclass clazz, jlong context_ptr, jint index) {
    (void) clazz;
    const char *text = whisper_full_get_segment_text((struct whisper_context *) context_ptr, index);
    return (*env)->NewStringUTF(env, text);
}
