#!/usr/bin/env bash
# AdSense "Not found" deep audit — 2026-11-04
# Verifies: (1) snippet coverage on tool pages, (2) 4 homepage variants,
# (3) DNS/SSL, (4) crawler accessibility (robots + Google UAs), (5) ads.txt,
# (6) production robots directives, (7) mixed content.
set -u
BASE="https://www.pixkitapp.online"
PUB="ca-pub-1791950384087416"
UA_BOT="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
UA_ADS="Mediapartners-Google"

echo "### 1) TOOL-PAGE SNIPPET COVERAGE"
for p in /image-compressor /resize-image /compress-png-image; do
  n=$(curl -s --max-time 15 "$BASE$p" | grep -c "$PUB" || true)
  echo "  pub-count=$n  $p"
done

echo "### 2) FOUR HOMEPAGE VARIANTS (single-hop matrix)"
for u in "http://pixkitapp.online/" "http://www.pixkitapp.online/" "https://pixkitapp.online/" "https://www.pixkitapp.online/"; do
  r=$(curl -sS -o /dev/null -w '%{http_code}|redirect->%{redirect_url}|hops=%{num_redirects}|eff=%{url_effective}' --max-time 20 "$u" 2>&1)
  echo "  $u -> $r"
done

echo "### 3) FULL REDIRECT CHAIN FROM WORST CASE (http + apex)"
curl -sS -o /dev/null -L -w '  hops=%{num_redirects} final=%{http_code} final=%{url_effective}\n' --max-time 30 "http://pixkitapp.online/"

echo "### 4) DNS RESOLUTION"
python3 - <<'EOF'
import socket
for h in ("pixkitapp.online", "www.pixkitapp.online"):
    try:
        ips = sorted({ai[4][0] for ai in socket.getaddrinfo(h, 443, socket.AF_INET)})
        print(f"  {h} -> {', '.join(ips)}")
    except Exception as e:
        print(f"  {h} -> ERROR {e}")
EOF

echo "### 5) SSL CERTIFICATES"
for h in pixkitapp.online www.pixkitapp.online; do
  echo "  --- $h"
  echo | openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null | sed 's/^/    /'
done

echo "### 6) ROBOTS.TXT (full)"
curl -s --max-time 15 "$BASE/robots.txt" | sed 's/^/  | /'

echo "### 7) CRAWLER UA ACCESS (Googlebot / Mediapartners-Google)"
for ua in "$UA_BOT" "$UA_ADS"; do
  code=$(curl -s -o /tmp/ua-test.html -w '%{http_code}' -A "$ua" --max-time 20 "$BASE/")
  n=$(grep -c "$PUB" /tmp/ua-test.html || true)
  echo "  UA='${ua:0:34}' -> HTTP $code, pub-count=$n, bytes=$(stat -c%s /tmp/ua-test.html)"
done

echo "### 8) ADS.TXT CURRENT STATUS (production)"
for h in www.pixkitapp.online pixkitapp.online; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$h/ads.txt")
  echo "  https://$h/ads.txt -> HTTP $code"
done

echo "### 9) PRODUCTION ROBOTS DIRECTIVES (header + meta)"
if curl -sI --max-time 15 "$BASE/" | grep -qi '^x-robots-tag'; then
  echo "  !! X-Robots-Tag PRESENT -> $(curl -sI --max-time 15 "$BASE/" | grep -i '^x-robots-tag')"
else
  echo "  X-Robots-Tag header: ABSENT (correct for production)"
fi
curl -s --max-time 15 "$BASE/" | grep -oE '<meta name="robots" content="[^"]*"' | head -2 | sed 's/^/  live meta: /'

echo "### 10) MIXED CONTENT SCAN (homepage)"
mc=$(curl -s --max-time 15 "$BASE/" | grep -cE '(src|href)="http://' || true)
echo "  insecure (http://) src/href count = $mc"
