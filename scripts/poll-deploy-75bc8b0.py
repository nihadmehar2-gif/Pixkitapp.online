#!/usr/bin/env python3
"""Poll live site until commit 75bc8b0's fixes are visible (Vercel deploy Ready)."""
import re, sys, time, random, urllib.request

SITE = "https://www.pixkitapp.online"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) deploy-verify/1.0"}

NEW_PRIVACY = [
    "How Google uses information from sites or apps that use our services",
    "Appropriate cookie/consent controls will be implemented",
    "the image tools do not ask users to provide personal information",
]
OLD_PRIVACY = [
    "GA4 does not log or store your IP address",
    "no personal data held by us",
]
NEW_HOME = ["A growing collection of practical image tools"]
OLD_HOME = ["Genuinely different tools"]


def fetch(url: str) -> str:
    req = urllib.request.Request(url + ("?cb=%d" % random.randint(10**7, 10**8)), headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", errors="replace")


def main() -> int:
    for attempt in range(1, 13):
        try:
            privacy = fetch(SITE + "/privacy")
            home = fetch(SITE + "/")
        except Exception as e:
            print(f"[{attempt}] fetch error: {e}; retry in 30s", flush=True)
            time.sleep(30)
            continue

        ok_new = [m for m in NEW_PRIVACY if m in privacy]
        miss_new = [m for m in NEW_PRIVACY if m not in privacy]
        still_old = [m for m in OLD_PRIVACY if m in privacy]
        home_new = [m for m in NEW_HOME if m in home]
        home_old = [m for m in OLD_HOME if m in home]

        print(f"[{attempt}] privacy new {len(ok_new)}/3 {ok_new or ''} | missing {miss_new or '-'} | stale-present {still_old or '-'} | home new {bool(home_new)} | home stale {home_old or '-'}", flush=True)

        if not miss_new and not still_old and home_new and not home_old:
            print("=== ALL LIVE MARKERS VERIFIED — deployment Ready ===", flush=True)
            return 0
        time.sleep(30)
    print("=== WARNING: markers not verified after 12 attempts ===", flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
