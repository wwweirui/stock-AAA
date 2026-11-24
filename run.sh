#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8787}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [ ! -d frontend/node_modules ]; then
  echo "→ installing frontend dependencies"
  pnpm --dir frontend install
fi

if [ "${BUILD:-1}" = "1" ] || [ ! -f frontend/dist/index.html ]; then
  echo "→ building frontend"
  pnpm --dir frontend build
fi

echo "→ serving 研值 at http://127.0.0.1:${PORT}"
exec "$PYTHON_BIN" -m uvicorn backend.main:app --host 127.0.0.1 --port "$PORT"
