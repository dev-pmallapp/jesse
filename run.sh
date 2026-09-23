#!/usr/bin/env bash
#
# run.sh — launch Jesse (API + dashboard) in containers, running THIS repo's
# code, for local development.
#
# The repo is bind-mounted into the app container so that editing files here
# and running `./run.sh restart` picks up the change immediately — no image
# rebuild needed for ordinary Python edits. Live trading is out of scope;
# this is a dev/backtesting sandbox only.
#
# Usage:
#   ./run.sh [up|down|restart|logs|status|build]
#
#   up       Build the dev image if missing, start Postgres + Redis + Jesse,
#            and wait for them to become healthy. Default if no command given.
#            Safe to re-run: if everything is already up it just says so.
#   down     Stop and remove the Postgres, Redis and Jesse dev containers.
#            The Postgres data volume is kept, so `up` again picks up where
#            you left off. Safe to re-run on an already-stopped stack.
#   restart  Recreate only the Jesse app container (fast path for picking up
#            code edits) without touching Postgres/Redis. Starts the DB/cache
#            containers first if they aren't already running.
#   logs     Tail the Jesse app container's logs (Ctrl-C to stop).
#   status   Show container state, the dashboard URL, and the dashboard
#            password.
#   build    Force a rebuild of the dev image from the Dockerfile.
#
# Environment overrides:
#   JESSE_PROJECT_DIR   Where the Jesse *project* (strategies/, storage/,
#                        .env) lives. Defaults to ./.jesse-project inside
#                        this repo. Created automatically on first `up`,
#                        including a generated .env and a random dashboard
#                        PASSWORD (printed once, and again via `status`).
#
# Notes on this environment:
#   - All containers use `--network host`. Rootless Podman here can't set up
#     its usual per-container network namespace (/dev/net/tun is missing),
#     but host networking sidesteps that — and it's a normal, supported mode
#     under real Docker on Linux too, so the script works either way.
#   - The container CLI is auto-detected: `docker` is preferred, falling
#     back to `podman`, so this also works on a plain Docker host.
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${JESSE_PROJECT_DIR:-"$REPO_DIR/.jesse-project"}"

IMAGE_NAME="localhost/jesse-dev"
NET_ARGS=(--network host) # see header comment: rootless netns is broken here

POSTGRES_CONTAINER="jesse-dev-postgres"
REDIS_CONTAINER="jesse-dev-redis"
APP_CONTAINER="jesse-dev"
POSTGRES_VOLUME="jesse-dev-postgres-data"

POSTGRES_IMAGE="docker.io/library/postgres:14-alpine"
REDIS_IMAGE="docker.io/library/redis:7-alpine"

# Fixed dev-only DB/cache credentials. They are only safe because Postgres,
# Redis and the dashboard are explicitly bound to 127.0.0.1 below: with host
# networking, the images' defaults (listen on all interfaces, Redis without a
# password or protected mode) would expose them to the whole LAN.
POSTGRES_DB="jesse_db"
POSTGRES_USER="jesse_user"
POSTGRES_PASSWORD="jesse_password"
POSTGRES_PORT="5432"
REDIS_PORT="6379"

APP_PORT="9000"

# ---------------------------------------------------------------------------
# Container CLI detection
# ---------------------------------------------------------------------------

if command -v docker >/dev/null 2>&1; then
  CLI="docker"
elif command -v podman >/dev/null 2>&1; then
  CLI="podman"
else
  echo "Error: neither docker nor podman found on PATH." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  echo "==> $*"
}

container_exists() {
  "$CLI" ps -a --format '{{.Names}}' | grep -Fxq "$1"
}

container_running() {
  "$CLI" ps --format '{{.Names}}' | grep -Fxq "$1"
}

image_exists() {
  # `images -q` is supported by both real Docker and Podman and returns a
  # (non-empty) image id when the tag exists, unlike podman-only `image exists`.
  [[ -n "$("$CLI" images -q "$IMAGE_NAME" 2>/dev/null)" ]]
}

build_image() {
  log "Building $IMAGE_NAME from Dockerfile..."
  # --network host: RUN steps (apt-get, pip) need real network access, and
  # the default rootless build network is broken here for the same
  # /dev/net/tun reason as container runtime networking (see header).
  "$CLI" build "${NET_ARGS[@]}" -t "$IMAGE_NAME" -f "$REPO_DIR/Dockerfile" "$REPO_DIR"
}

# Generate a random dashboard password. Prefer openssl (near-universal);
# fall back to /dev/urandom so this never hard-fails on a minimal host.
random_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 32
  fi
}

# Create the minimal Jesse *project* directory (strategies/, storage/, .env)
# that `jesse run` expects to be launched from (jesse.helpers.is_jesse_project
# just checks for a strategies/ and storage/ dir; storage's own subfolders
# are created lazily by the app at runtime).
ensure_project() {
  if [[ -d "$PROJECT_DIR" && -f "$PROJECT_DIR/.env" ]]; then
    return
  fi

  log "Creating Jesse project at $PROJECT_DIR ..."
  mkdir -p "$PROJECT_DIR/strategies" "$PROJECT_DIR/storage"

  local password
  password="$(random_password)"

  # Postgres/Redis are reached at their host-networked ports, since the app
  # container also runs with --network host and shares the host's network
  # namespace with the db/cache containers.
  cat > "$PROJECT_DIR/.env" <<EOF
# Generated by run.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ) — safe to edit.
APP_PORT=$APP_PORT
APP_HOST=127.0.0.1
PASSWORD=$password

POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=$POSTGRES_PORT
POSTGRES_NAME=$POSTGRES_DB
POSTGRES_USERNAME=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

REDIS_HOST=127.0.0.1
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=
REDIS_DB=0

IS_DEV_ENV=TRUE
EOF

  log "Dashboard password (also shown by './run.sh status'): $password"
}

dashboard_password() {
  if [[ -f "$PROJECT_DIR/.env" ]]; then
    grep -E '^PASSWORD=' "$PROJECT_DIR/.env" | head -1 | cut -d= -f2-
  fi
}

wait_for_postgres() {
  log "Waiting for Postgres to accept connections..."
  local i
  for i in $(seq 1 60); do
    if "$CLI" exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      log "Postgres is ready."
      return 0
    fi
    sleep 1
  done
  echo "Error: Postgres did not become ready in time." >&2
  "$CLI" logs --tail 50 "$POSTGRES_CONTAINER" >&2 || true
  exit 1
}

wait_for_redis() {
  log "Waiting for Redis to accept connections..."
  local i
  for i in $(seq 1 30); do
    if "$CLI" exec "$REDIS_CONTAINER" redis-cli ping 2>/dev/null | grep -q PONG; then
      log "Redis is ready."
      return 0
    fi
    sleep 1
  done
  echo "Error: Redis did not become ready in time." >&2
  "$CLI" logs --tail 50 "$REDIS_CONTAINER" >&2 || true
  exit 1
}

start_postgres() {
  if container_running "$POSTGRES_CONTAINER"; then
    log "Postgres already running."
    return
  fi
  if container_exists "$POSTGRES_CONTAINER"; then
    log "Starting existing Postgres container..."
    "$CLI" start "$POSTGRES_CONTAINER" >/dev/null
  else
    log "Creating Postgres container..."
    "$CLI" run -d "${NET_ARGS[@]}" \
      --name "$POSTGRES_CONTAINER" \
      -e POSTGRES_DB="$POSTGRES_DB" \
      -e POSTGRES_USER="$POSTGRES_USER" \
      -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
      -v "${POSTGRES_VOLUME}:/var/lib/postgresql/data" \
      "$POSTGRES_IMAGE" -p "$POSTGRES_PORT" -c listen_addresses=127.0.0.1 >/dev/null
  fi
  wait_for_postgres
}

start_redis() {
  if container_running "$REDIS_CONTAINER"; then
    log "Redis already running."
    return
  fi
  if container_exists "$REDIS_CONTAINER"; then
    log "Starting existing Redis container..."
    "$CLI" start "$REDIS_CONTAINER" >/dev/null
  else
    log "Creating Redis container..."
    "$CLI" run -d "${NET_ARGS[@]}" \
      --name "$REDIS_CONTAINER" \
      "$REDIS_IMAGE" --port "$REDIS_PORT" --bind 127.0.0.1 --protected-mode yes >/dev/null
  fi
  wait_for_redis
}

# Bind-mount flags for the repo and project dir. SELinux hosts (e.g. Fedora/
# RHEL with enforcing mode) need ":Z" so the container can actually read/write
# through the mount; only add it when the host is SELinux-enforcing so we
# don't break plain Docker/Podman hosts where ":Z" is unnecessary (and, on
# some non-SELinux systems, rejected).
mount_suffix() {
  if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" == "Enforcing" ]]; then
    echo ":Z"
  else
    echo ""
  fi
}

start_app() {
  if container_running "$APP_CONTAINER"; then
    log "Jesse app already running."
    return
  fi
  if container_exists "$APP_CONTAINER"; then
    "$CLI" rm -f "$APP_CONTAINER" >/dev/null
  fi

  local suffix
  suffix="$(mount_suffix)"

  log "Starting Jesse app container..."
  # - Repo is bind-mounted over /jesse-docker (where the image's editable
  #   install points), so edits here take effect without a rebuild.
  # - Rootless Podman remaps container-root to the host user automatically
  #   (via subuid/subgid), so files the container creates under the mounted
  #   dirs come back owned by the host user; under real Docker on Linux the
  #   container runs as root like the image build does, matching this
  #   image's existing (root) runtime user, so ownership stays consistent
  #   with what the build already produced.
  # - `pip install -e /jesse-docker --no-deps -q` re-syncs editable-install
  #   metadata against the freshly mounted source before every start, so
  #   `restart` reliably picks up code changes (not just already-imported
  #   modules) without redoing the full (slow) dependency resolution.
  "$CLI" run -d "${NET_ARGS[@]}" \
    --name "$APP_CONTAINER" \
    -v "${REPO_DIR}:/jesse-docker${suffix}" \
    -v "${PROJECT_DIR}:/jesse-project${suffix}" \
    -w /jesse-project \
    "$IMAGE_NAME" \
    sh -c "pip install -e /jesse-docker --no-deps -q && exec jesse run" >/dev/null
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

cmd_build() {
  build_image
}

cmd_up() {
  if ! image_exists; then
    build_image
  fi
  ensure_project
  start_postgres
  start_redis
  start_app
  cmd_status
}

cmd_down() {
  local c
  for c in "$APP_CONTAINER" "$REDIS_CONTAINER" "$POSTGRES_CONTAINER"; do
    if container_exists "$c"; then
      log "Removing $c..."
      "$CLI" rm -f "$c" >/dev/null
    else
      log "$c is not running."
    fi
  done
}

cmd_restart() {
  # Fast path for the dev loop: only the app container is recreated. DB/cache
  # are left alone if already up (started first if they're not).
  start_postgres
  start_redis
  if container_exists "$APP_CONTAINER"; then
    "$CLI" rm -f "$APP_CONTAINER" >/dev/null
  fi
  start_app
  cmd_status
}

cmd_logs() {
  "$CLI" logs -f "$APP_CONTAINER"
}

cmd_status() {
  echo
  echo "Container status:"
  local c
  for c in "$POSTGRES_CONTAINER" "$REDIS_CONTAINER" "$APP_CONTAINER"; do
    if container_running "$c"; then
      echo "  $c: running"
    elif container_exists "$c"; then
      echo "  $c: stopped"
    else
      echo "  $c: not created"
    fi
  done
  echo
  echo "Dashboard: http://localhost:${APP_PORT}"
  echo "Password:  $(dashboard_password)"
  echo "Logs:      ./run.sh logs"
  echo
}

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

cmd="${1:-up}"

case "$cmd" in
  up) cmd_up ;;
  down) cmd_down ;;
  restart) cmd_restart ;;
  logs) cmd_logs ;;
  status) cmd_status ;;
  build) cmd_build ;;
  *)
    echo "Usage: $0 [up|down|restart|logs|status|build]" >&2
    exit 1
    ;;
esac
