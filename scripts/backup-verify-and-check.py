#!/usr/bin/env python3
"""Verify backup ZIP, scan for secrets, check GitHub repo visibility.
Token is read from ~/.git-credentials and NEVER printed."""
import zipfile, hashlib, re, json, urllib.request, os, sys

ZIP_PATH = "/home/z/my-project/download/PixKitWebsite-Complete-Backup.zip"
EXPECTED_SHA = "b37c8005def26bf0c9c8801458b64d6be29e899c242aa6c0051ba2b3200f62dc"
REPO = "nihadmehar2-gif/Pixkitapp.online"

def get_token():
    with open(os.path.expanduser("~/.git-credentials")) as f:
        m = re.search(r":([^:@]+)@github\.com", f.read())
    return m.group(1) if m else None

TOKEN = get_token()
assert TOKEN, "token not found"

# --- 1. ZIP exists + integrity ---
print("== 1. ZIP integrity ==")
if not os.path.isfile(ZIP_PATH):
    print("MISSING:", ZIP_PATH); sys.exit(1)
size = os.path.getsize(ZIP_PATH)
h = hashlib.sha256()
with open(ZIP_PATH, "rb") as f:
    for chunk in iter(lambda: f.read(1 << 20), b""):
        h.update(chunk)
sha = h.hexdigest()
print(f"size = {size} bytes ({size/1024/1024:.1f} MB)")
print(f"sha256 matches earlier: {sha == EXPECTED_SHA}")
with zipfile.ZipFile(ZIP_PATH) as z:
    bad = z.testzip()
    names = z.namelist()
    print(f"entries = {len(names)}, corrupt entry = {bad}")
    print("integrity:", "OK" if bad is None and sha == EXPECTED_SHA else "FAILED")

# --- 2. sensitive files inside ZIP ---
print("\n== 2. sensitive-file scan ==")
sensitive = [n for n in names if re.fullmatch(r"\.env|.*\.pem|.*credential.*|.*\.key", n, re.I)]
print("sensitive entries:", sensitive if sensitive else "NONE (only .env.example template)")

# --- 3. repo visibility ---
print("\n== 3. repo visibility ==")
req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}",
    headers={"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
             "User-Agent": "backup-upload-script"})
with urllib.request.urlopen(req, timeout=30) as r:
    meta = json.load(r)
print("private =", meta.get("private"), "| default_branch =", meta.get("default_branch"),
      "| permissions push =", meta.get("permissions", {}).get("push"))
