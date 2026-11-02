#!/usr/bin/env python3
"""Poll Vercel deployment (via public GitHub commit statuses) then verify
live-site markers for the quality-repair push b255f97."""
import json
import time
import urllib.request

REPO = "nihadmehar2-gif/Pixkitapp.online"
SHA = "b255f97"
SITE = "https://www.pixkitapp.online"


def get(url: str, timeout: int = 30):
    req = urllib.request.Request(url, headers={"User-Agent": "pixkit-verify/1.0"})
    return urllib.request.urlopen(req, timeout=timeout)


def deployment_ready() -> dict:
    for i in range(60):  # up to ~10 min
        try:
            with get(f"https://api.github.com/repos/{REPO}/commits/{SHA}/status") as r:
                data = json.loads(r.read())
            state = data.get("state")
            statuses = [
                {"context": s["context"], "state": s["state"]}
                for s in data.get("statuses", [])
            ]
            print(f"poll {i}: state={state} statuses={json.dumps(statuses)}")
            if state == "success":
                return {"state": state, "statuses": statuses}
            if state == "error" or state == "failure":
                return {"state": state, "statuses": statuses}
        except Exception as e:  # noqa: BLE001
            print(f"poll {i}: api error {e}")
        time.sleep(10)
    return {"state": "timeout"}


def check(name: str, url: str, must_contain: list[str], must_not_contain: list[str] | None = None,
          allow_redirect: bool = True) -> dict:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None
    try:
        opener = urllib.request.build_opener(NoRedirect) if not allow_redirect else urllib.request.build_opener()
        req = urllib.request.Request(url, headers={"User-Agent": "pixkit-verify/1.0"})
        resp = opener.open(req, timeout=30)
        body = resp.read().decode("utf-8", "replace")
        final_url = resp.geturl()
        status = resp.status
    except urllib.error.HTTPError as e:
        body = ""
        final_url = e.geturl()
        status = e.code
    out = {
        "check": name,
        "url": url,
        "status": status,
        "final_url": final_url,
        "present": [m for m in must_contain if m in body],
        "missing": [m for m in must_contain if m not in body],
        "forbidden_found": [m for m in (must_not_contain or []) if m in body],
    }
    out["ok"] = (
        (200 <= status < 300)
        and not out["missing"]
        and not out["forbidden_found"]
    )
    print(json.dumps(out))
    return out


def main() -> int:
    dep = deployment_ready()
    print("DEPLOYMENT:", json.dumps(dep))
    results = {"deployment": dep, "checks": []}
    if dep["state"] != "success":
        results["verdict"] = "DEPLOYMENT NOT SUCCESSFUL — live checks skipped"
        print(json.dumps(results, indent=1))
        return 1

    checks = [
        ("compressor default 85 in about", f"{SITE}/image-compressor",
         ["shrink substantially at 85% quality"], ["at 75% quality"]),
        ("optimize-for-web 85", f"{SITE}/optimize-image-for-web",
         ["WebP at 85"], ["WebP at 80"]),
        ("email resizer 90", f"{SITE}/email-image-resizer",
         ["JPEG quality 90"], ["JPEG quality 70"]),
        ("near-lossless page up", f"{SITE}/near-lossless-image-compressor",
         ["Near-Lossless Image Compressor"], []),
        ("KB tool 50kb up", f"{SITE}/compress-image-to-50kb",
         ["Compress Image to 50KB or Less"], []),
        ("custom kb up", f"{SITE}/compress-image-to-specific-size",
         ["Compress Image to a Custom Size"], []),
        ("resize-to-kb up", f"{SITE}/resize-image-to-kb",
         ["Resize Image to a Target File Size"], []),
        ("image-to-pdf up", f"{SITE}/image-to-pdf",
         ["Image to PDF Converter"], []),
        ("privacy up", f"{SITE}/privacy",
         ["Google Analytics"], []),
        ("sitemap", f"{SITE}/sitemap.xml", ["<urlset"], []),
        ("robots", f"{SITE}/robots.txt", ["User-agent"], []),
        ("308 redirect", f"{SITE}/lossless-image-compressor",
         [], [], False),
    ]
    ok = True
    for name, url, must, mustnot, *rest in checks:
        allow = rest[0] if rest else True
        r = check(name, url, must, mustnot, allow_redirect=allow)
        if name == "308 redirect":
            r["ok"] = r["status"] == 308 and r["final_url"].endswith("/lossless-image-compressor")
        ok = ok and r["ok"]
        results["checks"].append(r)

    results["verdict"] = "ALL LIVE CHECKS PASS" if ok else "SOME LIVE CHECKS FAILED"
    print(json.dumps({"verdict": results["verdict"]}))
    with open("/tmp/live-verify-b255f97.json", "w") as f:
        json.dump(results, f, indent=1)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
