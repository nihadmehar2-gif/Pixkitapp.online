# PixKitApp ships with minification disabled; these keeps are future-proofing
# in case it is ever enabled, so the JS download bridge is never stripped.
-keepclassmembers class com.pixkitapp.app.MainActivity$DownloadBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
