#!/usr/bin/env bash
# run.sh — boot the local Open Resume Studio stack.
#
# Starts the FastAPI backend (port 8000) and the Next.js frontend (port 3000)
# side by side. SQLite tables and template previews are created on first run.
#
# Usage:
#   ./run.sh              # backend + frontend together
#   ./run.sh backend      # backend only
#   ./run.sh frontend     # frontend only
#
# Configuration (override any of these by exporting in your shell):
#   BACKEND_HOST          default: 127.0.0.1
#   BACKEND_PORT          default: 8000
#   FRONTEND_PORT         default: 3000
#   LLM_PROVIDER          default: gemini   (read by backend)
#   GEMINI_API_KEY        unset             (read by backend; required for LLM features)
#   OPENAI_API_KEY        unset             (when LLM_PROVIDER=openai)
#   ANTHROPIC_API_KEY     unset             (when LLM_PROVIDER=anthropic)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Frontend config — replaces the previous frontend/.env.local file.
# The Next.js dev server picks these up from process.env at startup.
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://${BACKEND_HOST}:${BACKEND_PORT}}"
export NEXT_PUBLIC_USE_MOCKS="${NEXT_PUBLIC_USE_MOCKS:-false}"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }
step()  { printf "\n\033[1;36m→ %s\033[0m\n" "$*"; }

pick_python() {
  # pyproject.toml requires >=3.12. Prefer 3.13, then 3.12, then python3 if it satisfies.
  for candidate in python3.13 python3.12; do
    if command -v "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  if command -v python3 >/dev/null 2>&1; then
    local ver
    ver="$(python3 -c 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")')"
    if [[ "$(printf '%s\n' "3.12" "$ver" | sort -V | head -n1)" == "3.12" ]]; then
      echo "python3"
      return 0
    fi
  fi
  red "No Python >=3.12 found. Install python@3.12 (brew install python@3.12) and retry."
  exit 1
}

ensure_backend_venv() {
  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    step "Creating backend virtualenv"
    local py
    py="$(pick_python)"
    cyan "  using $py ($($py --version))"
    "$py" -m venv "$BACKEND_DIR/.venv"
    "$BACKEND_DIR/.venv/bin/pip" install --upgrade pip
    "$BACKEND_DIR/.venv/bin/pip" install -e "$BACKEND_DIR"
    green "✓ Backend deps installed"
  fi
}

ensure_frontend_deps() {
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    step "Installing frontend deps"
    (cd "$FRONTEND_DIR" && npm install)
    green "✓ Frontend deps installed"
  fi
}

start_backend() {
  ensure_backend_venv
  step "Starting backend on http://$BACKEND_HOST:$BACKEND_PORT"
  cd "$BACKEND_DIR"
  "$BACKEND_DIR/.venv/bin/uvicorn" src.main:app \
    --reload --host "$BACKEND_HOST" --port "$BACKEND_PORT"
}

start_frontend() {
  ensure_frontend_deps
  step "Starting frontend on http://localhost:$FRONTEND_PORT"
  cyan "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
  cd "$FRONTEND_DIR"
  npm run dev -- --port "$FRONTEND_PORT"
}

start_both() {
  ensure_backend_venv
  ensure_frontend_deps

  cd "$BACKEND_DIR"
  "$BACKEND_DIR/.venv/bin/uvicorn" src.main:app \
    --reload --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
  BACKEND_PID=$!

  cd "$FRONTEND_DIR"
  npm run dev -- --port "$FRONTEND_PORT" &
  FRONTEND_PID=$!

  trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM EXIT
  green "✓ Backend  http://$BACKEND_HOST:$BACKEND_PORT (pid=$BACKEND_PID)"
  green "✓ Frontend http://localhost:$FRONTEND_PORT (pid=$FRONTEND_PID)"
  green "✓ Stop with Ctrl-C"
  wait
}

main() {
  local mode="${1:-all}"
  case "$mode" in
    all)      start_both ;;
    backend)  start_backend ;;
    frontend) start_frontend ;;
    *)
      red "Unknown mode: $mode"
      echo "Usage: $0 [all|backend|frontend]"
      exit 1
      ;;
  esac
}

main "$@"
