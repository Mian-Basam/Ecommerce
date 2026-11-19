#!/usr/bin/env bash
# run.sh - install, (optionally) seed, and start the ShopOnline backend + frontend.
#
# Usage:
#   ./run.sh            install deps if needed, then start backend + frontend (dev mode)
#   ./run.sh --seed     same, but seed the database with sample data first
#   ./run.sh --prod     build the frontend and run it in production mode
#   ./run.sh --help
#
# Environment overrides:
#   FRONTEND_PORT   port for Next.js (default 3000)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/Ecommerce/shop-online-backend"
FRONTEND="$ROOT/Ecommerce/shop-online-frontend"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

SEED=false
PROD=false
for arg in "$@"; do
  case "$arg" in
    --seed) SEED=true ;;
    --prod) PROD=true ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)"; exit 1 ;;
  esac
done

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m  %s\n' "$*"; }
fail() { printf '\033[1;31mxx\033[0m  %s\n' "$*"; exit 1; }

# ---- prerequisites --------------------------------------------------------
command -v node >/dev/null || fail "Node.js is not installed (need v18.18+; v20+ recommended)."
command -v npm  >/dev/null || fail "npm is not installed."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || fail "Node.js $(node -v) is too old; need v18.18 or newer."

# ---- env files ------------------------------------------------------------
if [ ! -f "$BACKEND/.env" ]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  warn "Created $BACKEND/.env from .env.example - edit MONGO_URI / JWT_SECRET as needed."
fi
if [ ! -f "$FRONTEND/.env.local" ]; then
  cp "$FRONTEND/.env.example" "$FRONTEND/.env.local"
  warn "Created $FRONTEND/.env.local from .env.example."
fi

# Read PORT from the backend .env (default 5000) so we can report it.
BACKEND_PORT="$(grep -E '^PORT=' "$BACKEND/.env" | tail -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
BACKEND_PORT="${BACKEND_PORT:-5000}"

# ---- dependencies ---------------------------------------------------------
for dir in "$BACKEND" "$FRONTEND"; do
  if [ ! -d "$dir/node_modules" ]; then
    info "Installing dependencies in $(basename "$dir") ..."
    (cd "$dir" && npm install --no-audit --no-fund)
  fi
done

# ---- seed -----------------------------------------------------------------
if $SEED; then
  info "Seeding database (users, products, deals, sample reviews) ..."
  (cd "$BACKEND" && node lib/dbInit.js)
fi

# ---- start ----------------------------------------------------------------
PIDS=()
cleanup() {
  echo
  info "Shutting down ..."
  for pid in "${PIDS[@]:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

info "Starting backend on http://localhost:$BACKEND_PORT ..."
(cd "$BACKEND" && exec node server.js) &
PIDS+=($!)

if $PROD; then
  info "Building frontend for production ..."
  (cd "$FRONTEND" && npm run build)
  info "Starting frontend (production) on http://localhost:$FRONTEND_PORT ..."
  (cd "$FRONTEND" && exec npx next start -p "$FRONTEND_PORT") &
else
  info "Starting frontend (dev) on http://localhost:$FRONTEND_PORT ..."
  (cd "$FRONTEND" && exec npx next dev --turbopack -p "$FRONTEND_PORT") &
fi
PIDS+=($!)

info "Both servers started. Press Ctrl+C to stop."
# Exit (and clean up the other one) as soon as either process stops.
while kill -0 "${PIDS[0]}" 2>/dev/null && kill -0 "${PIDS[1]}" 2>/dev/null; do
  sleep 1
done
warn "A server exited - stopping the other one."
