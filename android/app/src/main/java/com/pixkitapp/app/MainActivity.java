package com.pixkitapp.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * PixKitApp - thin, secure WebView wrapper around the PixKitApp website.
 *
 * Design goals:
 *  - zero changes to the website itself; the URL lives in res/values/strings.xml
 *  - image <input type="file"> pickers work via the system file chooser
 *  - client-side "blob:" downloads (how every tool saves images) work via a
 *    small JS bridge and are saved into the public Downloads folder
 *  - Android Back navigates website history before leaving the app
 *  - offline / network errors show a retry screen instead of a blank page
 *  - only HTTPS is loaded (cleartext is disabled in the manifest)
 */
public class MainActivity extends AppCompatActivity {

    private static final int RC_FILE_CHOOSER = 1001;
    private static final int RC_STORAGE_PERMISSION = 1002;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private View errorView;
    private Button retryButton;

    private ValueCallback<Uri[]> filePathCallback;
    private String startUrl;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        startUrl = getString(R.string.start_url);

        webView = findViewById(R.id.web_view);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        progressBar = findViewById(R.id.progress_bar);
        errorView = findViewById(R.id.error_view);
        retryButton = findViewById(R.id.retry_button);

        configureWebView();
        configureNavigationCallbacks();

        // One-time storage permission on Android 9 or lower so tool downloads
        // can land in the public Downloads folder (Android 10+ needs nothing).
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
                && ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, RC_STORAGE_PERMISSION);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        retryButton.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            if (webView.getUrl() != null) {
                webView.reload();
            } else {
                webView.loadUrl(startUrl);
            }
        });

        swipeRefresh.setOnRefreshListener(() -> {
            if (webView.getUrl() != null) {
                webView.reload();
            } else {
                webView.loadUrl(startUrl);
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(startUrl);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // No local file/content access from web content; uploads go through
        // the system file picker which returns content:// URIs.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);

        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.brand_bg));

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new DownloadBridge(), "AndroidBlobDownloader");
    }

    private void configureNavigationCallbacks() {
        webView.setWebViewClient(new PixKitWebViewClient());
        webView.setWebChromeClient(new PixKitWebChromeClient());
        webView.setDownloadListener(this::onDownloadRequested);
    }

    /* ------------------------------------------------------------------ */
    /* Navigation                                                          */
    /* ------------------------------------------------------------------ */

    private class PixKitWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
            return handleUrl(request.getUrl().toString());
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            errorView.setVisibility(View.GONE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            swipeRefresh.setRefreshing(false);
            injectDownloadBridge(view);
        }

        @Override
        public void onReceivedError(WebView view, @NonNull WebResourceRequest request, @Nullable WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                showErrorView();
            }
        }

        @Override
        public boolean onRenderProcessGone(@NonNull WebView view, RenderProcessGoneDetail detail) {
            // WebView renderer crashed - rebuild the activity instead of showing a dead view.
            recreate();
            return true;
        }
    }

    private boolean handleUrl(String url) {
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);

        if (scheme.equals("http") || scheme.equals("https")) {
            if (isInternalHost(uri.getHost())) {
                return false; // load inside the app
            }
            openExternally(uri);
            return true;
        }

        if (scheme.equals("mailto") || scheme.equals("tel") || scheme.equals("sms")
                || scheme.equals("market") || scheme.equals("whatsapp") || scheme.equals("intent")) {
            openExternally(uri);
            return true;
        }

        return true; // unknown scheme: never let the WebView try it
    }

    /** Same-site pages stay in the app; everything else opens in a browser. */
    private boolean isInternalHost(String host) {
        if (host == null) return false;
        String h = host.toLowerCase(Locale.ROOT);

        if (h.equals("pixkitapp.com") || h.endsWith(".pixkitapp.com")) return true;

        String configured = getString(R.string.internal_host).trim().toLowerCase(Locale.ROOT);
        if (!configured.isEmpty() && (h.equals(configured) || h.endsWith("." + configured))) return true;

        String startHost = Uri.parse(startUrl).getHost();
        if (startHost != null) {
            String sh = startHost.toLowerCase(Locale.ROOT);
            if (h.equals(sh) || h.endsWith("." + sh)) return true;
        }
        return false;
    }

    private void openExternally(Uri uri) {
        try {
            Intent intent;
            if ("intent".equals(uri.getScheme())) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }
            startActivity(intent);
        } catch (Exception ignored) {
            // No app can handle it - do nothing instead of crashing.
        }
    }

    private void showErrorView() {
        swipeRefresh.setRefreshing(false);
        progressBar.setVisibility(View.GONE);
        errorView.setVisibility(View.VISIBLE);
    }

    /* ------------------------------------------------------------------ */
    /* Loading progress                                                    */
    /* ------------------------------------------------------------------ */

    private class PixKitWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;

            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(acceptTypeFor(params));
            if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }

            try {
                startActivityForResult(
                        Intent.createChooser(intent, getString(R.string.select_file)), RC_FILE_CHOOSER);
            } catch (ActivityNotFoundException e) {
                filePathCallback = null;
                return false;
            }
            return true;
        }
    }

    /** Maps the website's accept="image/*" style hints onto a system picker type. */
    private String acceptTypeFor(WebChromeClient.FileChooserParams params) {
        String[] types = params == null ? null : params.getAcceptTypes();
        if (types == null || types.length == 0) return "*/*";
        String joined = TextUtils.join(",", types).toLowerCase(Locale.ROOT);

        if (joined.contains("image")) return "image/*";
        if (joined.contains("video")) return "video/*";
        if (joined.contains("audio")) return "audio/*";
        if (joined.contains("pdf")) return "application/pdf";

        for (String raw : types) {
            String t = raw == null ? "" : raw.trim();
            if (t.isEmpty()) continue;
            if (t.contains("/")) return t;
            if (t.startsWith(".")) {
                String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(t.substring(1));
                if (mime != null) return mime;
            }
        }
        return "*/*";
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (requestCode == RC_FILE_CHOOSER && filePathCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /* ------------------------------------------------------------------ */
    /* Downloads                                                           */
    /* ------------------------------------------------------------------ */

    private void onDownloadRequested(String url, String userAgent,
                                     String contentDisposition, String mimeType, long contentLength) {
        if (url == null) return;

        if (url.startsWith("blob:")) {
            // The JS bridge intercepts these; reaching here means the hook was
            // not injected yet (e.g. very fast navigation). Nothing sane to do.
            return;
        }
        if (url.startsWith("data:")) {
            saveDataUrl(url);
            return;
        }
        enqueueHttpDownload(url, userAgent, contentDisposition, mimeType);
    }

    private void enqueueHttpDownload(String url, String userAgent,
                                     String contentDisposition, String mimeType) {
        try {
            String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null && !cookie.isEmpty()) request.addRequestHeader("Cookie", cookie);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setTitle(fileName);
            request.setMimeType(mimeType == null || mimeType.isEmpty()
                    ? "application/octet-stream" : mimeType);

            if (canWritePublicDownloads()) {
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            } else {
                request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, fileName);
            }

            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                toast(getString(R.string.download_started));
            }
        } catch (Exception e) {
            toast(getString(R.string.download_failed));
        }
    }

    private void saveDataUrl(String url) {
        try {
            int comma = url.indexOf(',');
            if (comma < 0) throw new IllegalStateException("malformed data URL");
            String header = url.substring(5, comma);
            String payload = url.substring(comma + 1);
            if (!header.contains(";base64")) return;
            String mime = header.split(";")[0];
            String name = "pixkitapp-download." + extForMime(mime);
            saveBytes(name, mime, Base64.decode(payload, Base64.DEFAULT));
        } catch (Exception e) {
            toast(getString(R.string.download_failed));
        }
    }

    private boolean canWritePublicDownloads() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) return true; // scoped storage
        return ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                == PackageManager.PERMISSION_GRANTED;
    }

    /** Bridge called from pixkit_bridge.js for client-side blob: downloads. */
    private class DownloadBridge {
        @JavascriptInterface
        public void save(String name, String mime, String base64) {
            try {
                saveBytes(name, mime, Base64.decode(base64, Base64.DEFAULT));
            } catch (Exception e) {
                runOnUiThread(() -> toast(getString(R.string.download_failed)));
            }
        }

        @JavascriptInterface
        public void error() {
            runOnUiThread(() -> toast(getString(R.string.download_failed)));
        }
    }

    private void saveBytes(String fileName, String mimeType, byte[] bytes) {
        String safeName = fileName == null || fileName.isEmpty()
                ? "pixkitapp-download" : fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
        String mime = mimeType == null || mimeType.isEmpty() ? "application/octet-stream" : mimeType;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri target = getContentResolver()
                        .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (target == null) throw new IllegalStateException("MediaStore rejected the file");
                try (OutputStream os = getContentResolver().openOutputStream(target)) {
                    if (os == null) throw new IllegalStateException("No output stream");
                    os.write(bytes);
                }
            } else if (canWritePublicDownloads()) {
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists()) dir.mkdirs();
                File out = new File(dir, uniqueName(dir, safeName));
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    fos.write(bytes);
                }
            } else {
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) throw new IllegalStateException("No storage available");
                if (!dir.exists()) dir.mkdirs();
                File out = new File(dir, uniqueName(dir, safeName));
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    fos.write(bytes);
                }
            }
            runOnUiThread(() -> toast(getString(R.string.download_done, safeName)));
        } catch (Exception e) {
            runOnUiThread(() -> toast(getString(R.string.download_failed)));
        }
    }

    private String uniqueName(File dir, String name) {
        File candidate = new File(dir, name);
        if (!candidate.exists()) return name;
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 1; i < 1000; i++) {
            candidate = new File(dir, base + " (" + i + ")" + ext);
            if (!candidate.exists()) return candidate.getName();
        }
        return "pixkitapp-" + System.currentTimeMillis() + ext;
    }

    private String extForMime(String mime) {
        if (mime == null) return "bin";
        String sub = mime.contains("/") ? mime.substring(mime.indexOf('/') + 1) : mime;
        sub = sub.split(";")[0].split("\\+")[0];
        if (sub.isEmpty()) return "bin";
        if (sub.equals("jpeg")) return "jpg";
        return sub;
    }

    private void injectDownloadBridge(WebView view) {
        String js = readRawResource(R.raw.pixkit_bridge);
        if (!js.isEmpty()) {
            view.evaluateJavascript(js, null);
        }
    }

    private String readRawResource(int resId) {
        try (InputStream is = getResources().openRawResource(resId)) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int read;
            while ((read = is.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }
            return buffer.toString("UTF-8");
        } catch (Exception e) {
            return "";
        }
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    /* ------------------------------------------------------------------ */
    /* State                                                               */
    /* ------------------------------------------------------------------ */

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
