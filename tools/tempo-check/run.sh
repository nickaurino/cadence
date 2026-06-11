#!/usr/bin/env bash
# Compiles the REAL TempoAnalyzer (modules/cadence-music-kit/ios/TempoAnalyzer.swift)
# together with the harness and runs it on this Mac. No simulator, no Xcode
# project — TempoAnalyzer only needs AVFoundation + Accelerate, both on macOS.
#
# Usage: bash tools/tempo-check/run.sh
# Needs: Xcode command line tools (swiftc) and a network connection.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
ANALYZER="$ROOT/modules/cadence-music-kit/ios/TempoAnalyzer.swift"
OUT="$(mktemp -d)/tempo-check"

if [ ! -f "$ANALYZER" ]; then
  echo "Could not find TempoAnalyzer at $ANALYZER" >&2
  exit 1
fi

echo "Compiling real TempoAnalyzer + harness..."
swiftc -O "$ANALYZER" "$DIR/main.swift" -o "$OUT" \
  -framework AVFoundation -framework Accelerate

echo "Running (resolves previews from iTunes, downloads, analyzes)..."
echo
"$OUT"
