cmake_minimum_required(VERSION 3.22.1)

project(lao_learner_whisper)

set(CMAKE_CXX_STANDARD 17)
set(WHISPER_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../../../../whispercpp)

add_library(
    offline_whisper
    SHARED
    ${WHISPER_ROOT}/src/whisper.cpp
    ${WHISPER_ROOT}/jni.c
)

set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE OFF CACHE BOOL "" FORCE)
add_subdirectory(${WHISPER_ROOT}/ggml ${CMAKE_CURRENT_BINARY_DIR}/ggml)

find_library(LOG_LIB log)
target_compile_definitions(offline_whisper PUBLIC GGML_USE_CPU PRIVATE WHISPER_VERSION="1.9.2")
target_compile_options(offline_whisper PRIVATE -O3 -fvisibility=hidden -fvisibility-inlines-hidden)
target_link_options(offline_whisper PRIVATE -Wl,--gc-sections -Wl,--exclude-libs,ALL)
target_include_directories(offline_whisper PRIVATE
    ${WHISPER_ROOT}
    ${WHISPER_ROOT}/include
    ${WHISPER_ROOT}/src
    ${WHISPER_ROOT}/ggml/include
    ${WHISPER_ROOT}/ggml/src
)
target_link_libraries(offline_whisper ${LOG_LIB} android ggml)
