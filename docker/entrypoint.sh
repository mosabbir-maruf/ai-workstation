#!/usr/bin/env bash
set -euo pipefail

export HOME=/home/sandbox
export NPM_CONFIG_PREFIX=/home/sandbox/.npm-global
export PATH=/home/sandbox/.npm-global/bin:$PATH

DSH_VERSION="${DSH_VERSION:-0.1.2-rc.1}"

if ! command -v dsh >/dev/null 2>&1; then
    echo "Installing DeepSeek Harness ${DSH_VERSION}..."
    npm install --prefix "$NPM_CONFIG_PREFIX" \
        "@deepseek-ai/dsh@${DSH_VERSION}"
fi

exec "$@"
