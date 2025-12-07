#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Packaging central-collector jar..."
CC_BUILD="$ROOT_DIR/central-collector/build"
CC_LIBS="$CC_BUILD/libs"
mkdir -p "$CC_LIBS"
pushd "$CC_BUILD" >/dev/null
if [ -d classes ]; then
  jar cf "$CC_LIBS/central-collector.jar" -C classes .
fi
if [ -d resources/main ]; then
  (cd resources/main && jar uf "$CC_LIBS/central-collector.jar" -C . .) || true
fi
popd >/dev/null

echo "Packaging tracking-client-demo jar..."
TC_BUILD="$ROOT_DIR/tracking-client-demo/build"
TC_LIBS="$TC_BUILD/libs"
mkdir -p "$TC_LIBS"
pushd "$TC_BUILD" >/dev/null
if [ -d classes ]; then
  jar cf "$TC_LIBS/tracking-client-demo.jar" -C classes .
fi
if [ -d resources/main ]; then
  (cd resources/main && jar uf "$TC_LIBS/tracking-client-demo.jar" -C . .) || true
fi
popd >/dev/null

echo "Packaged jars:"
ls -la "$CC_LIBS" || true
ls -la "$TC_LIBS" || true

echo "Done."
