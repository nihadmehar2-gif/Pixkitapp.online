#!/usr/bin/env python3
"""Poll GitHub (authenticated via env GHT) for Vercel preview URLs for a commit.

Reads the token ONLY from the environment variable GHT — never stored on disk.
"""
import json
import os
import sys
import time
import urllib.request

REPO = "nihadmehar2-gif/Pixkitapp.online"
SHA = sys.argv[1] if len(sys.argv) > 1 else "da4e9d4d6c5dbfafdf6529dbe605377754c1489a"
TOKEN = os.environ.get("GHT", "")
WAIT = int(os.environ.get("WAIT", "210"))


def gh(url):
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "pixkit-hotfix-check",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except Exception as e:
        return getattr(e, "code", 0), {"error": str(e)}


found = {}
deadline = time.time() + WAIT
while time.time() < deadline:
    st, data = gh(f"https://api.github.com/repos/{REPO}/commits/{SHA}/status")
    if st == 200:
        for s in data.get("statuses", []):
            if s.get("target_url"):
                found[s.get("context", "?")] = s["target_url"]
    st2, cr = gh(f"https://api.github.com/repos/{REPO}/commits/{SHA}/check-runs")
    if st2 == 200:
        for c in cr.get("check_runs", []):
            if c.get("details_url"):
                found[c.get("name", "?")] = c["details_url"]
    st3, dep = gh(f"https://api.github.com/repos/{REPO}/deployments?sha={SHA}&per_page=10")
    if st3 == 200 and isinstance(dep, list):
        for d in dep:
            key = f"deployment:{d.get('environment', '?')}"
            found[key] = d.get("html_url", "")
    verd = {k: v for k, v in found.items() if "vercel" in k.lower() and v}
    if verd:
        print("FOUND=" + json.dumps(verd, indent=2))
        sys.exit(0)
    if found:
        print("pending:", json.dumps(found), flush=True)
    time.sleep(20)
print("NONE after wait; last seen:", json.dumps(found))
sys.exit(1)
