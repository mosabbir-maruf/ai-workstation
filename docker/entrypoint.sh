#!/usr/bin/env bash
set -euo pipefail

export HOME=/home/sandbox
export NPM_CONFIG_PREFIX=/home/sandbox/.npm-global
export PATH=/home/sandbox/.npm-global/bin:/usr/local/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/bin:/bin

DSH_VERSION="${DSH_VERSION:-0.1.2-rc.1}"
DSH_BIN="/home/sandbox/.npm-global/node_modules/@deepseek-ai/dsh/lib/bin.js"

if [[ ! -f "$DSH_BIN" ]]; then
    echo "Installing DeepSeek Harness ${DSH_VERSION}..."
    npm install --prefix "$NPM_CONFIG_PREFIX" \
        "@deepseek-ai/dsh@${DSH_VERSION}"
fi

git config --global --unset-all credential.helper 2>/dev/null || true
git config --global credential.helper /usr/local/bin/github-app-credential-helper
git config --global credential.useHttpPath true

echo "DSH runtime: $(node "$DSH_BIN" --version 2>/dev/null || node "$DSH_BIN" --version)"

exec "$@"
