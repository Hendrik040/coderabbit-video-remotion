#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

# Use the developer's Node, or the runtime bundled with the Codex desktop app.
if ! command -v node >/dev/null 2>&1; then
  studio_runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
  if [ ! -x "$studio_runtime/node" ]; then
    echo "Install Node.js 22 or newer, then run npm install and npm run studio:setup." >&2
    exit 1
  fi
  PATH="$studio_runtime:$PATH"
  export PATH
fi
if [ ! -d node_modules ]; then
  echo "Run npm install and npm run studio:setup from the repository root first." >&2
  exit 1
fi
exec node studio/server/index.mjs "$@"
