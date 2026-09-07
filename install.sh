#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v docker >/dev/null 2>&1 ||
    { echo "ERROR: Docker is required."; exit 1; }

mkdir -p \
    "$ROOT/runtime/dsh" \
    "$ROOT/runtime/npm-global" \
    "$HOME/projects"

[[ -f "$ROOT/.env" ]] ||
    cp "$ROOT/.env.example" "$ROOT/.env"

chmod 700 \
    "$ROOT/runtime" \
    "$ROOT/runtime/dsh" \
    "$ROOT/runtime/npm-global"

sudo install -m 0755 \
    "$ROOT/scripts/ai" \
    /usr/local/bin/ai

echo "AI Workstation installed."
