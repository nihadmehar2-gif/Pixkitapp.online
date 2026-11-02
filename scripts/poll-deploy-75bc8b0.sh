#!/bin/bash
# Poll live site until commit 75bc8b0's fixes are visible (Vercel deploy Ready)
SITE="https://www.pixkitapp.online"
PASS=0; FAIL=0
for i in $(seq 1 12); do
  echo "=== Attempt $i ($(date -u +%H:%M:%SZ)) ==="
  PRIVACY=$(curl -sL --max-time 20 -H "Cache-Control: no-cache" "$SITE/privacy?cb=$RANDOM$RANDOM")
  HOME=$(curl -sL --max-time 20 -H "Cache-Control: no-cache" "$SITE/?cb=$RANDOM$RANDOM")

  # NEW markers (from 75bc8b0) must be present
  M1=$(echo "$PRIVACY" | grep -c "How Google uses information from sites or apps that use our services")
  M2=$(echo "$PRIVACY" | grep -c "Appropriate cookie/consent controls will be implemented")
  M3=$(echo "$PRIVACY" | grep -c "the image tools do not ask users to provide personal information")
  # OLD stale strings must be gone
  O1=$(echo "$PRIVACY" | grep -c "GA4 does not log or store your IP address")
  O2=$(echo "$PRIVACY" | grep -c "no personal data held by us")
  H1=$(echo "$HOME" | grep -c "A growing collection of practical image tools")
  H2=$(echo "$HOME" | grep -c "Genuinely different tools")

  echo "  privacy new-markers: partnerSites=$M1 consent=$M2 personalInfo=$M3"
  echo "  privacy old-strings (want 0): ipClaim=$O1 noDataHeld=$O2"
  echo "  home new=$H1 old(want 0)=$H2"

  if [ "$M1" -ge 1 ] && [ "$M2" -ge 1 ] && [ "$M3" -ge 1 ] && [ "$O1" -eq 0 ] && [ "$O2" -eq 0 ] && [ "$H1" -ge 1 ] && [ "$H2" -eq 0 ]; then
    echo "=== ALL LIVE MARKERS VERIFIED — deployment Ready ==="
    PASS=1
    break
  else
    FAIL=$((FAIL+1))
    echo "  -> not live yet, waiting 30s..."
    sleep 30
  fi
done
[ "$PASS" -eq 1 ] || echo "=== WARNING: markers not verified after $FAIL attempts ==="
