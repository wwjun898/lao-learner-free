package com.laolearner.app;

import android.util.Base64;
import android.util.Xml;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import okhttp3.*;
import okio.ByteString;
import org.xmlpull.v1.XmlSerializer;

/** Edge read-aloud protocol, matching edge-tts-universal 1.4.0 used by the Web app. */
@CapacitorPlugin(name = "MicrosoftSpeech")
public class MicrosoftSpeechPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS).build();
    private volatile WebSocket active;
    // Public Edge client identifier, not a user API key.
    private static final String CLIENT = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

    @PluginMethod
    public void synthesize(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty() || text.length() > 4000) {
            call.reject("请输入 1 到 4000 个字符后播放");
            return;
        }
        boolean slow = call.getBoolean("slow", false);
        worker.execute(() -> {
            try {
                byte[] audio = request(text, slow);
                JSObject result = new JSObject();
                result.put("audioBase64", Base64.encodeToString(audio, Base64.NO_WRAP));
                call.resolve(result);
            } catch (Exception error) {
                call.reject("微软语音暂时不可用，请检查网络后重试：" + error.getMessage());
            }
        });
    }

    private byte[] request(String text, boolean slow) throws Exception {
        long seconds = System.currentTimeMillis() / 1000 + 11644473600L;
        String input = Long.toString((seconds - seconds % 300) * 10000000L) + CLIENT;
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.US_ASCII));
        StringBuilder hash = new StringBuilder();
        for (byte b : digest) hash.append(String.format(Locale.ROOT, "%02X", b & 255));
        String id = UUID.randomUUID().toString().replace("-", "");
        String url = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1"
            + "?TrustedClientToken=" + CLIENT + "&Sec-MS-GEC=" + hash
            + "&Sec-MS-GEC-Version=1-143.0.3650.75&ConnectionId=" + id;
        Request request = new Request.Builder().url(url)
            .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0")
            .header("Cookie", "muid=" + id.toUpperCase(Locale.ROOT) + ";")
            .build();
        SimpleDateFormat date = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'", Locale.US);
        date.setTimeZone(TimeZone.getTimeZone("UTC"));
        String timestamp = date.format(new Date());
        StringWriter xml = new StringWriter();
        XmlSerializer writer = Xml.newSerializer();
        writer.setOutput(xml);
        writer.startTag(null, "speak").attribute(null, "version", "1.0")
            .attribute(null, "xmlns", "http://www.w3.org/2001/10/synthesis").attribute(null, "xml:lang", "lo-LA");
        writer.startTag(null, "voice").attribute(null, "name", "Microsoft Server Speech Text to Speech Voice (lo-LA, ChanthavongNeural)");
        writer.startTag(null, "prosody").attribute(null, "rate", slow ? "-35%" : "+0%")
            .attribute(null, "pitch", "+0Hz").attribute(null, "volume", "+0%");
        writer.text(text.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", " "));
        writer.endTag(null, "prosody").endTag(null, "voice").endTag(null, "speak");
        writer.flush();
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> failure = new AtomicReference<>();
        ByteArrayOutputStream audio = new ByteArrayOutputStream();
        WebSocket socket = client.newWebSocket(request, new WebSocketListener() {
            @Override public void onOpen(WebSocket ws, Response response) {
                ws.send("X-Timestamp:" + timestamp + "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
                    + "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":false,\"wordBoundaryEnabled\":false},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}");
                ws.send("X-RequestId:" + id + "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" + timestamp + "Z\r\nPath:ssml\r\n\r\n" + xml);
            }
            @Override public void onMessage(WebSocket ws, ByteString bytes) {
                byte[] data = bytes.toByteArray();
                if (data.length < 2) return;
                int offset = 2 + ((data[0] & 255) << 8) + (data[1] & 255);
                if (offset > data.length) { failure.set("音频格式无效"); done.countDown(); return; }
                String headers = new String(data, 2, offset - 2, StandardCharsets.UTF_8);
                if (headers.contains("Path:audio") && data.length > offset) {
                    if (audio.size() + data.length - offset > 8 * 1024 * 1024) {
                        failure.set("音频过长，请分段播放"); done.countDown(); return;
                    }
                    audio.write(data, offset, data.length - offset);
                }
            }
            @Override public void onMessage(WebSocket ws, String message) {
                if (message.contains("Path:turn.end")) done.countDown();
            }
            @Override public void onFailure(WebSocket ws, Throwable error, Response response) {
                failure.set(response == null ? error.getClass().getSimpleName() : "HTTP " + response.code());
                done.countDown();
            }
            @Override public void onClosed(WebSocket ws, int code, String reason) {
                if (done.getCount() > 0) { failure.set("连接提前关闭"); done.countDown(); }
            }
        });
        active = socket;
        try {
            if (!done.await(35, TimeUnit.SECONDS)) throw new Exception("连接超时");
            if (failure.get() != null) throw new Exception(failure.get());
            if (audio.size() < 512) throw new Exception("未返回有效音频");
            return audio.toByteArray();
        } finally { socket.cancel(); active = null; }
    }

    @Override protected void handleOnDestroy() {
        if (active != null) active.cancel();
        worker.shutdownNow();
        client.dispatcher().executorService().shutdown();
        client.connectionPool().evictAll();
        super.handleOnDestroy();
    }
}
