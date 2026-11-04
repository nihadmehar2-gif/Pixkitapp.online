/*
 * PixKitApp download bridge (injected into every page by MainActivity).
 *
 * Why this exists: the website saves processed images with
 *   a.href = URL.createObjectURL(blob); a.download = name; a.click()
 * Android WebView routes those "blob:" downloads through DownloadManager,
 * which cannot fetch blob: URLs, so the download silently fails.
 *
 * This hook intercepts those clicks (both real taps and synthetic .click()
 * on anchors that were never attached to the DOM) and hands the bytes to
 * the Android side via window.AndroidBlobDownloader.
 */
(function () {
  "use strict";
  if (window.__PIXKIT_DOWNLOAD_HOOK__) { return; }
  window.__PIXKIT_DOWNLOAD_HOOK__ = true;

  function extFromMime(mime) {
    if (!mime) { return ""; }
    var sub = String(mime).split("/")[1] || "";
    sub = sub.split("+")[0].split(";")[0];
    if (!sub) { return ""; }
    if (sub === "jpeg") { return "jpg"; }
    return sub;
  }

  function ensureExtension(name, mime) {
    var base = String(name || "pixkitapp-download").split("?")[0].split("#")[0];
    if (!base) { base = "pixkitapp-download"; }
    if (/\.[A-Za-z0-9]{1,6}$/.test(base)) { return base; }
    var ext = extFromMime(mime);
    return ext ? base + "." + ext : base;
  }

  function fail() {
    if (window.AndroidBlobDownloader && window.AndroidBlobDownloader.error) {
      window.AndroidBlobDownloader.error();
    }
  }

  function saveBlob(blob, suggestedName) {
    try {
      var mime = blob && blob.type ? blob.type : "application/octet-stream";
      var name = ensureExtension(suggestedName, mime);
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        var idx = result.indexOf(",");
        var payload = idx >= 0 ? result.substring(idx + 1) : result;
        if (window.AndroidBlobDownloader && window.AndroidBlobDownloader.save) {
          window.AndroidBlobDownloader.save(name, mime, payload);
        } else {
          fail();
        }
      };
      reader.onerror = fail;
      reader.readAsDataURL(blob);
    } catch (e) {
      fail();
    }
  }

  /* Returns true when this anchor was handled (blob download taken over). */
  function handleAnchor(anchor) {
    if (!anchor || anchor.__pixkitHandled) { return false; }
    var href = anchor.getAttribute("href") || "";
    if (href.indexOf("blob:") !== 0) { return false; }
    anchor.__pixkitHandled = true;
    var name = anchor.getAttribute("download") || "";
    fetch(href)
      .then(function (response) { return response.blob(); })
      .then(function (blob) { saveBlob(blob, name); })
      .catch(fail);
    return true;
  }

  /* Real user taps: anchors ARE in the document, event bubbles to us. */
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) { return; }
    var target = event.target;
    if (!target || !target.closest) { return; }
    var anchor = target.closest("a[download]");
    if (anchor && handleAnchor(anchor)) {
      event.preventDefault();
    }
  }, false);

  /* Programmatic downloads: site calls a.click() on detached anchors, which
     never bubbles to document. Patch prototype.click for that case. */
  var originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.getAttribute ? (this.getAttribute("href") || "") : "";
    if (this.download && href.indexOf("blob:") === 0) {
      handleAnchor(this);
      return;
    }
    originalClick.apply(this, arguments);
  };
}());
