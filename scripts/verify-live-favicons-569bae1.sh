#!/usr/bin/env bash
# Live verification of favicon assets + homepage metadata after 569bae1 deploy.
set -u
BASE="https://www.pixkitapp.online"
PUB="/home/z/my-project/public"
UA="Mozilla/5.0 (compatible; favicon-verify)"

echo "=== A) ICON ASSET URLS (live vs local sha256) ==="
for f in favicon.ico favicon-48x48.png favicon-96x96.png apple-touch-icon.png icon-192.png icon-512.png icon-512-maskable.png icon.svg logo.svg; do
  tmp=$(mktemp)
  hdr=$(curl -s -D - -o "$tmp" -A "$UA" "$BASE/$f?nocache=$RANDOM" | tr -d '\r')
  code=$(echo "$hdr" | head -1 | awk '{print $2}')
  ctype=$(echo "$hdr" | rg -i "^content-type:" | head -1 | cut -d' ' -f2)
  cache=$(echo "$hdr" | rg -i "^age:|^x-vercel-cache:" | head -1 | tr -d '\n')
  live_bytes=$(stat -c%s "$tmp")
  live_hash=$(sha256sum "$tmp" | cut -c1-16)
  local_hash=$(sha256sum "$PUB/$f" | cut -c1-16)
  local_bytes=$(stat -c%s "$PUB/$f")
  if [ "$live_hash" = "$local_hash" ]; then verdict="MATCH"; else verdict="DIFF!!"; fi
  echo "$f | HTTP $code | $ctype | live=${live_bytes}B local=${local_bytes}B | $verdict | $cache"
  rm -f "$tmp"
done

echo ""
echo "=== B) HOMEPAGE HEAD METADATA ==="
html=$(curl -s -A "$UA" "$BASE/?nocache=$RANDOM")
echo "-- icon/apple-icon/svg declarations --"
echo "$html" | rg -o '<link[^>]*rel="[^"]*icon[^"]*"[^>]*>' | head -12
echo "-- shortcut/other icon rels --"
echo "$html" | rg -o '<link[^>]*rel="(?:shortcut icon|mask-icon|apple-touch-icon[^"]*)"[^>]*>' | head -8
echo "-- canonical --"
echo "$html" | rg -o '<link[^>]*rel="canonical"[^>]*>' | head -3
echo "-- og:image / twitter --"
echo "$html" | rg -o '<meta[^>]*(og:image|twitter:image|twitter:card)[^>]*>' | head -8
echo "-- JSON-LD logo --"
echo "$html" | rg -o '"logo"[^}]*' | head -4
echo "-- favicon.ico explicit reference count --"
echo "$html" | rg -c "favicon.ico" || echo "0 references"
