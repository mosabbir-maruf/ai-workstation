#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

git -C "$ROOT" pull --ff-only

if command -v ai >/dev/null 2>&1; then
    ai upgrade
else
    "$ROOT/install.sh"
fi
