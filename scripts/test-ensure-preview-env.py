#!/usr/bin/env python3
"""Non-disruptive tests for ensure_preview_env() in scripts/dev-daemon.py.

Safe because the dev server on :3000 keeps running: each daemon invocation
runs ensure_preview_env() FIRST, then hits the "port already served" check
and exits without touching the server. If the server were down, a dev-mode
invocation would simply restart it through the sanctioned daemon path.
"""
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import urllib.request

PROJ = "/home/z/my-project"
os.chdir(PROJ)

spec = importlib.util.spec_from_file_location("dev_daemon", f"{PROJ}/scripts/dev-daemon.py")
dd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dd)

ENV_FILES = list(dd.PREVIEW_ENV_FILES)


def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def daemon_call(*args):
    r = subprocess.run(
        [sys.executable, f"{PROJ}/scripts/dev-daemon.py", *args],
        capture_output=True, text=True, timeout=60,
    )
    return r.returncode


def port_up():
    try:
        with urllib.request.urlopen("http://127.0.0.1:3000/", timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS" if cond else "FAIL"), "-", name, flush=True)


def wipe():
    for n in ENV_FILES:
        p = os.path.join(PROJ, n)
        if os.path.exists(p):
            os.remove(p)


def read(n):
    with open(os.path.join(PROJ, n), encoding="utf-8") as f:
        return f.read()


# --- setup: canonical baseline ---
wipe()
daemon_call()
baseline = {n: sha(os.path.join(PROJ, n)) for n in ENV_FILES}
check("SETUP files canonical after one daemon call",
      all(read(n) == dd.PREVIEW_ENV_FILES[n] for n in ENV_FILES))

# T1: healthy files -> daemon no-op, byte-identical (idempotent, no churn)
rc = daemon_call()
check("T1 daemon exits 0 while server up", rc == 0)
check("T1 files byte-identical after repeat call (idempotent)",
      all(sha(os.path.join(PROJ, n)) == baseline[n] for n in ENV_FILES))

# T2: custom var preserved when switch present
pv = os.path.join(PROJ, ".env.preview")
with open(pv, "a", encoding="utf-8") as f:
    f.write("CUSTOM_KEEP_ME=1\n")
daemon_call()
content = read(".env.preview")
check("T2 custom var preserved when switch line present",
      "CUSTOM_KEEP_ME=1" in content and "NEXT_PUBLIC_INDEXING_MODE=preview" in content)

# T3: wiped files -> recreated byte-identical to canonical constant
wipe()
daemon_call()
check("T3 wiped files recreated byte-identical to canonical",
      all(read(n) == dd.PREVIEW_ENV_FILES[n] for n in ENV_FILES))

# T4: --mode prod must never seed (requires server up so daemon exits at port check)
if port_up():
    wipe()
    daemon_call("--mode", "prod")
    check("T4 prod-mode invocation leaves both files absent",
          all(not os.path.exists(os.path.join(PROJ, n)) for n in ENV_FILES))
else:
    print("SKIP - T4 (server down; refusing to risk a prod-mode start)")

# restore canonical after T4
daemon_call()
check("RESTORE files canonical again",
      all(read(n) == dd.PREVIEW_ENV_FILES[n] for n in ENV_FILES))

# T5: edge case — file with custom var but WITHOUT the switch line
with open(pv, "w", encoding="utf-8") as f:
    f.write("CUSTOM_ONLY=1\n")
daemon_call()
check("T5(edge) switchless file overwritten to canonical — custom var in it is lost (documented)",
      read(".env.preview") == dd.PREVIEW_ENV_FILES[".env.preview"])

# F1: server still up and untouched throughout
check("F1 dev server still serving 200 on :3000 (non-disruptive)", port_up())

print("RESULT_JSON=" + json.dumps({k: v for k, v in results}))
sys.exit(0 if all(c for _, c in results) else 1)
