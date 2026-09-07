#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env"

die() {
    echo "ERROR: $*" >&2
    exit 1
}

echo
echo "========================================"
echo "        AI Workstation Installer"
echo "========================================"
echo

# --------------------------------------------------
# Basic requirements
# --------------------------------------------------

command -v sudo >/dev/null 2>&1 ||
    die "sudo is required."

command -v docker >/dev/null 2>&1 ||
    die "Docker is required. Install Docker first."

docker info >/dev/null 2>&1 ||
    die "Docker daemon is not accessible."

command -v git >/dev/null 2>&1 ||
    die "Git is required."

command -v python3 >/dev/null 2>&1 ||
    die "Python 3 is required."

# --------------------------------------------------
# Required Python venv support
# --------------------------------------------------

if ! python3 -m venv --help >/dev/null 2>&1; then
    echo "Installing Python venv support..."
    sudo apt-get update
    sudo apt-get install -y python3-venv
fi

# --------------------------------------------------
# Directory structure
# --------------------------------------------------

echo "Creating directories..."

mkdir -p \
    "$ROOT/runtime/dsh" \
    "$ROOT/runtime/npm-global" \
    "$ROOT/runtime/github-broker" \
    "$ROOT/secrets" \
    "$HOME/projects"

chmod 700 \
    "$ROOT/runtime" \
    "$ROOT/runtime/dsh" \
    "$ROOT/runtime/npm-global" \
    "$ROOT/runtime/github-broker" \
    "$ROOT/secrets"

# --------------------------------------------------
# Environment
# --------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
    [[ -f "$ROOT/.env.example" ]] ||
        die ".env.example not found."

    cp "$ROOT/.env.example" "$ENV_FILE"
    chmod 600 "$ENV_FILE"

    echo "✓ Created .env"
else
    echo "✓ .env already exists"
fi

# --------------------------------------------------
# Python virtual environment
# --------------------------------------------------

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
    echo "Creating Python virtual environment..."

    python3 -m venv "$ROOT/.venv"

    echo "✓ Python virtual environment created"
else
    echo "✓ Python virtual environment already exists"
fi

# --------------------------------------------------
# Python dependencies
# --------------------------------------------------

echo "Checking Python dependencies..."

"$ROOT/.venv/bin/python" -m pip install \
    --disable-pip-version-check \
    --quiet \
    --upgrade \
    pip

"$ROOT/.venv/bin/python" -m pip install \
    --disable-pip-version-check \
    --quiet \
    PyJWT

echo "✓ PyJWT ready"

# --------------------------------------------------
# Install AI CLI
# --------------------------------------------------

echo "Installing ai CLI..."

sudo install -m 0755 \
    "$ROOT/scripts/ai" \
    /usr/local/bin/ai

echo "✓ ai CLI installed"

# --------------------------------------------------
# Validation
# --------------------------------------------------

echo
echo "Running validation..."

[[ -x /usr/local/bin/ai ]] ||
    die "ai CLI installation failed."

[[ -x "$ROOT/.venv/bin/python" ]] ||
    die "Python virtual environment is unavailable."

"$ROOT/.venv/bin/python" -c 'import jwt' >/dev/null ||
    die "PyJWT installation failed."

[[ -d "$ROOT/runtime/dsh" ]] ||
    die "runtime/dsh missing."

[[ -d "$ROOT/runtime/npm-global" ]] ||
    die "runtime/npm-global missing."

[[ -d "$ROOT/runtime/github-broker" ]] ||
    die "runtime/github-broker missing."

[[ -d "$ROOT/secrets" ]] ||
    die "secrets directory missing."

echo
echo "========================================"
echo "      AI Workstation installed ✓"
echo "========================================"
echo
echo "Next:"
echo
echo "  ai doctor"
echo "  ai github setup"
echo "  ai list"
echo
