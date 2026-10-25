# PixKitApp for Android

A lightweight, secure **WebView app** that wraps the PixKitApp website
(https://pixkitapp.vercel.app/) into a native Android application. The website
itself is **not modified in any way** — this project only packages it.

- **App name:** PixKitApp
- **Package ID:** `com.pixkitapp.app` (derived from the pixkitapp.com domain —
  do not change it after publishing; all future updates must keep it)
- **Version:** 1.0.0 (versionCode 1)
- **minSdk:** 24 (Android 7.0, covers ~98% of devices)
- **targetSdk / compileSdk:** 36 (Android 16 — meets Google Play and Samsung
  Galaxy Store target-API requirements for 2026)
- **Language:** pure Java, no third-party SDKs, no analytics, no trackers

---

## 1. Why a WebView app (and not a Trusted Web Activity)?

| Consideration | WebView (this project) | TWA |
|---|---|---|
| Domain changes | Just edit one string | Requires a matching `assetlinks.json` on the *exact* domain + signature; a mismatch shows an ugly browser bar |
| Device coverage | System WebView is on ~100% of devices | Requires Chrome / a Custom Tabs provider |
| Blob downloads | Handled by a small, audited JS bridge (`res/raw/pixkit_bridge.js`) | Not controllable |
| File pickers & back navigation | Fully controlled | Browser-driven |

Since the current Vercel URL is temporary and a custom domain is coming, a
WebView app is the approach that survives the migration without any
verification-file choreography.

---

## 2. Changing the website URL (when your custom domain is ready)

**One file, two lines:**

```
android/app/src/main/res/values/strings.xml
```

```xml
<string name="start_url" translatable="false">https://pixkitapp.vercel.app/</string>
<string name="internal_host" translatable="false">pixkitapp.com</string>
```

1. Set `start_url` to your permanent domain (e.g. `https://pixkitapp.com/`).
2. `internal_host` controls which links stay *inside* the app vs. open in the
   user's browser. If your new domain ends with `pixkitapp.com` you don't need
   to touch it. Otherwise set it to your new domain (without `https://`).
3. Bump `versionCode` (e.g. `1` → `2`) and `versionName` in
   `android/app/build.gradle`.
4. Rebuild + re-sign (section 4) — **always with the same keystore**
   (`keystore/pixkitapp-release.jks`), otherwise Android and the stores will
   reject the update.

---

## 3. Project layout

```
android/
├── app/
│   ├── build.gradle                  # versions, signing hook, dependencies
│   └── src/main/
│       ├── AndroidManifest.xml       # permissions (INTERNET only, + legacy storage ≤Android 9)
│       ├── java/com/pixkitapp/app/MainActivity.java   # the whole app
│       └── res/
│           ├── layout/activity_main.xml               # WebView + progress + error/retry UI
│           ├── raw/pixkit_bridge.js                   # blob-download bridge
│           ├── values/strings.xml                     # ← WEBSITE URL LIVES HERE
│           ├── values/colors.xml                      # brand palette from the website
│           └── mipmap-*/                              # launcher icons from site branding
├── keystore/pixkitapp-release.jks    # release signing key (NOT in git — keep it safe!)
├── keystore.properties               # key credentials (NOT in git)
└── README.md
```

### What the app handles natively

- **Back button:** navigates website history first, exits only at the top page.
- **Loading:** thin indeterminate progress bar + pull-to-refresh.
- **Offline / errors:** branded retry screen instead of a blank page
  (main-frame network failures only; the site's own 404/500 pages still render).
- **Image uploads:** every tool's file picker works through the Android system
  file chooser (single + multiple selection, `image/*` respected).
- **Downloads:** normal server downloads go through Android's DownloadManager;
  client-side **blob:** downloads (how every tool saves results) are captured
  by `pixkit_bridge.js` and saved into the public **Downloads** folder
  (MediaStore on Android 10+, no permission needed; on Android ≤9 a one-time
  storage permission is requested).
- **External links:** only `pixkitapp.com` (+ your configured host) stays
  in-app; everything else (mailto:, tel:, other sites) opens in the browser.
- **Crash safety:** a WebView renderer crash rebuilds the app instead of
  showing a dead screen.
- **Security:** HTTPS-only (cleartext disabled), Safe Browsing on, no local
  file access from web content, no cookies shared with other apps.

---

## 4. Building & signing

### Prerequisites
- JDK 17+
- Android SDK Platform 36 + Build-Tools 36.0.0
  (or simply open the `android/` folder in **Android Studio** and let it install)

### Command line

```bash
cd android
# one-time: point Gradle at your SDK
echo "sdk.dir=/path/to/Android/Sdk" > local.properties

# release APK (sideload / Galaxy Store) + AAB (Google Play)
./gradlew assembleRelease bundleRelease
```

Outputs:
- `app/build/outputs/apk/release/app-release.apk` — signed universal APK
- `app/build/outputs/bundle/release/app-release.aab` — signed bundle for Play

Signing is read from `keystore.properties` (see `KEYSTORE_INFO.txt` delivered
with this project for the passwords and certificate fingerprints). If that
file is missing, release builds silently fall back to the debug key — fine for
testing, never for publishing.

### Android Studio
`File → Open` the `android/` folder, then `Build → Generate Signed Bundle /
APK`, or just `Run` for development.

### CI (optional)
A ready-made GitHub Actions workflow ships with the source ZIP
(`.github/workflows/android-build.yml`). It builds a debug APK on every push
to `android/**` and signed release artifacts when secrets are configured.
It is *not* included in the git repository because pushing workflow files
requires a token with the `workflow` scope — add it via GitHub's web UI
(Add file → upload the file) or use a token with that scope. To get signed
release artifacts from CI, add four repository secrets:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_B64` | `base64 -w0 keystore/pixkitapp-release.jks` |
| `ANDROID_STORE_PASSWORD` | (see KEYSTORE_INFO.txt) |
| `ANDROID_KEY_ALIAS` | `pixkitapp` |
| `ANDROID_KEY_PASSWORD` | (see KEYSTORE_INFO.txt) |

---

## 5. Publishing checklists

### Google Play
1. Upload `app-release.aab` (Play may reject raw APKs for new apps).
2. Target API 36 ✓ (already set), 64-bit ✓ (the app has no native code, so
   32/64-bit compatibility is automatic).
3. Enroll in **Play App Signing** (recommended): Google keeps the release key;
   your `pixkitapp-release.jks` becomes the upload key — keep it anyway.
4. Store listing needs: privacy policy URL, content rating questionnaire,
   Data Safety form ("no data collected" — the site processes images locally),
   screenshots, 512×512 icon (`android/artifacts/playstore-icon-512.png`).

### Samsung Galaxy Store
1. Accepts the signed `app-release.apk` directly (or an AAB).
2. Same metadata needs as above; sell in all countries unless you have a
   reason not to.

---

## 6. What has been verified vs. what you should test

**Verified at build time (this project):**
- `./gradlew assembleRelease bundleRelease` succeeds; artifacts are signed
  (APK Signature Scheme v2 verified with `apksigner`).
- `aapt2 dump badging` confirms: package `com.pixkitapp.app`, label
  `PixKitApp`, minSdk 24 / targetSdk 36, only the two intended permissions.
- Icons (legacy + adaptive), the URL strings and the download bridge are
  present inside the APK.

**Not verified here (no emulator/device in the build environment):**
- Actual rendering and touch behavior on a phone. Please run this 5-minute
  smoke test after installing `app-release.apk`:
  1. App opens the website; icon and name show "P." branding.
  2. Open any tool → pick an image → process it → tap Download → check the
     Downloads app / notification ("Saved to Downloads: …" toast).
  3. Press system Back — it should walk website history, then exit.
  4. Turn Wi-Fi off, reload (pull down) → retry screen appears; turn Wi-Fi
     on → Try again works.
  5. Pinch/rotate: layout follows the site's responsive design.

### Troubleshooting
- **Download does nothing:** ensure you updated via a *newly built* APK whose
  `pixkit_bridge.js` is injected (it is, by default, on every finished page
  load).
- **"App not installed":** signature mismatch with an older sideload —
  uninstall the old copy first.
- **Play rejects the AAB:** you likely rebuilt with the debug fallback
  signature; restore `keystore.properties` per section 4.
