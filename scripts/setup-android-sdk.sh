#!/usr/bin/env bash
# One-time local toolchain setup for building the PixKitApp Android app.
set -euo pipefail

BASE=/home/z/my-project
SDK=$BASE/android-sdk
TOOLS=$BASE/tools
DL=$TOOLS/downloads
mkdir -p "$DL" "$SDK/cmdline-tools" "$TOOLS/gradle-user-home"

# ---- Android command-line tools -------------------------------------------
if [ ! -d "$SDK/cmdline-tools/latest" ]; then
  cd "$DL"
  if [ ! -f cmdtools.zip ]; then
    curl -fL --retry 3 -o cmdtools.zip \
      "https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip" \
      || curl -fL --retry 3 -o cmdtools.zip \
      "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  fi
  unzip -oq cmdtools.zip -d "$SDK/cmdline-tools"
  [ -d "$SDK/cmdline-tools/latest" ] || mv "$SDK/cmdline-tools/cmdline-tools" "$SDK/cmdline-tools/latest"
  echo "cmdline-tools installed"
fi

# ---- Gradle 8.13 -----------------------------------------------------------
if [ ! -d "$TOOLS/gradle-8.13" ]; then
  cd "$DL"
  [ -f gradle-8.13-bin.zip ] || curl -fL --retry 3 -o gradle-8.13-bin.zip \
    "https://services.gradle.org/distributions/gradle-8.13-bin.zip"
  unzip -oq gradle-8.13-bin.zip -d "$TOOLS"
  echo "gradle installed"
fi

echo "SETUP_COMPLETE"
