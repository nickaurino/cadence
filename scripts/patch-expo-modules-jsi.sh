#!/bin/bash
# Xcode 26 compatibility fix for expo-modules-jsi.
#
# Xcode 26 beta attaches extended attributes ("resource forks") to framework
# files it builds. When the outer Xcode build tries to package those files,
# it rejects them with "detritus not allowed". This patch adds a single
# `find ... xattr -c` call right after the framework is produced, clearing
# the bad metadata before packaging begins.
#
# Remove this script (and the postinstall entry in package.json) once Expo
# releases an SDK version that officially supports Xcode 26.

FILE="node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh"

if [[ ! -f "$FILE" ]]; then
  echo "patch-expo-modules-jsi: $FILE not found, skipping"
  exit 0
fi

if grep -q "xattr -c.*framework_src" "$FILE"; then
  echo "patch-expo-modules-jsi: already patched, skipping"
  exit 0
fi

sed -i '' 's|  # Replace the slice in place\.|  # Xcode 26 fix: clear extended attributes that cause "detritus not allowed"\n  find "$framework_src" -exec xattr -c {} \\; 2>\/dev\/null || true\n\n  # Replace the slice in place.|' "$FILE"

echo "patch-expo-modules-jsi: patched successfully"
