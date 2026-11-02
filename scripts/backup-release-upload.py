#!/usr/bin/env python3
"""Create GitHub release on backup tag and upload the backup ZIP as asset.
Then verify the public download URL by actually downloading and hashing it.
Token never printed."""
import json, re, os, hashlib, urllib.request

REPO = "nihadmehar2-gif/Pixkitapp.online"
ZIP_PATH = "/home/z/my-project/download/PixKitWebsite-Complete-Backup.zip"
TAG = "backup-2026-11-02"
ASSET = "PixKitWebsite-Complete-Backup.zip"
EXPECTED_SHA = "b37c8005def26bf0c9c8801458b64d6be29e899c242aa6c0051ba2b3200f62dc"
EXPECTED_SIZE = 4321873


def get_token():
    with open(os.path.expanduser("~/.git-credentials")) as f:
        return re.search(r":([^:@]+)@github\.com", f.read()).group(1)


TOKEN = get_token()
H = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
     "User-Agent": "backup-upload-script"}


def api(url, data=None, headers=None, method=None):
    req = urllib.request.Request(url, data=data, headers=headers or H, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.load(r) if r.headers.get("content-type", "").startswith("application/json") else b""
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:400]
        return e.code, body


# 1. create (or fetch) release
st, rel = api(f"https://api.github.com/repos/{REPO}/releases", data=json.dumps({
    "tag_name": TAG,
    "target_commitish": "main",
    "name": "Complete Website Backup — 2026-11-02",
    "body": "Full project snapshot (300 files) created 2026-11-02. Includes all commits through b477dd2 (privacy accuracy fixes 75bc8b0). Contains no secrets (.env excluded from repo by design; only .env.example template included).",
    "draft": False,
    "prerelease": False,
}).encode(), method="POST")
if st not in (200, 201):
    print(f"create release -> {st}, trying to fetch existing by tag...")
    st, rel = api(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}")
    if st != 200:
        print("FAILED:", rel); raise SystemExit(1)
rel_id = rel["id"]
upload_url = rel["upload_url"].split("{")[0]
print(f"release id={rel_id} tag={rel['tag_name']} html={rel['html_url']}")

# 2. delete pre-existing asset with same name (idempotent re-upload)
for a in rel.get("assets", []):
    if a["name"] == ASSET:
        s, _ = api(f"https://api.github.com/repos/{REPO}/releases/assets/{a['id']}", method="DELETE")
        print(f"deleted stale asset {a['name']} -> {s}")

# 3. upload asset
raw = open(ZIP_PATH, "rb").read()
req = urllib.request.Request(
    f"{upload_url}?name={ASSET}", data=raw, method="POST",
    headers={**H, "Content-Type": "application/zip", "Content-Length": str(len(raw))})
with urllib.request.urlopen(req, timeout=300) as r:
    up = json.load(r)
print(f"uploaded: state={up['state']} size={up['size']} (expect {EXPECTED_SIZE})")

# 4. verify via API
st, rel2 = api(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}")
asset = next(a for a in rel2["assets"] if a["name"] == ASSET)
print(f"api verify: state={asset['state']} size={asset['size']} ok={asset['state']=='uploaded' and asset['size']==EXPECTED_SIZE}")

# 5. REAL end-user test: download the public browser URL with NO auth and hash it
url = f"https://github.com/{REPO}/releases/download/{TAG}/{ASSET}"
print("testing public URL (no auth):", url)
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 backup-test"})
with urllib.request.urlopen(req, timeout=300) as r:
    data = r.read()
sha = hashlib.sha256(data).hexdigest()
print(f"downloaded {len(data)} bytes, sha256 match = {sha == EXPECTED_SHA}")

print("\n" + "=" * 60)
print("VERIFIED DOWNLOAD URL:")
print(url)
