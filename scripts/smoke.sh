#!/usr/bin/env bash
# End-to-end smoke:
#   1. boot `next dev` in the background (logs -> .next-dev.log)
#   2. wait for readiness
#   3. POST /api/chat synchronously (generateText)
#   4. sleep to let the BatchSpanProcessor flush to PostHog
#   5. kill the dev server and exit
# Usage: ./scripts/smoke.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="${REPO_DIR}/.next-dev.log"
PID_FILE="${REPO_DIR}/.next-dev.pid"
PORT=3000
BASE="http://localhost:${PORT}"
READY_TIMEOUT=60       # seconds to wait for dev server
FLUSH_SECONDS=15       # time to wait after the call for spans to flush

step() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

cleanup() {
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid="$(cat "$PID_FILE")"
        step "killing dev server (pid=${pid})"
        kill "$pid" 2>/dev/null || true
        # let Next tear down its Turbopack worker
        sleep 1
        kill -9 "$pid" 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
}
trap cleanup EXIT

cd "$REPO_DIR"

if [[ ! -f .env.local ]]; then
    echo "ERROR: .env.local not found. Copy .env.example and fill in the two keys." >&2
    exit 1
fi

step "starting next dev (log: ${LOG_FILE})"
: > "$LOG_FILE"
pnpm dev >> "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
printf '  pid=%s\n' "$(cat "$PID_FILE")"

step "waiting for ${BASE} to respond (timeout ${READY_TIMEOUT}s)"
start=$(date +%s)
deadline=$(( start + READY_TIMEOUT ))
while (( $(date +%s) < deadline )); do
    if curl -sSf -m 1 -o /dev/null "${BASE}" 2>/dev/null; then
        elapsed=$(( $(date +%s) - start ))
        printf '  ready in ~%ss\n' "$elapsed"
        break
    fi
    sleep 0.2
done
if ! curl -sSf -m 1 -o /dev/null "${BASE}" 2>/dev/null; then
    echo "ERROR: dev server did not come up in ${READY_TIMEOUT}s. Last log lines:" >&2
    tail -20 "$LOG_FILE" >&2
    exit 1
fi

step "POST ${BASE}/api/chat (blocking on generateText)"
RESPONSE="$(curl -sS -X POST "${BASE}/api/chat" \
    -H 'content-type: application/json' \
    -d '{"prompt":"Tell me a fun fact about hedgehogs."}' \
    -m 90)"
printf '  response: %.200s…\n' "$RESPONSE"

step "sleeping ${FLUSH_SECONDS}s for span batch to flush to PostHog"
sleep "$FLUSH_SECONDS"

step "done — check PostHog LLM analytics for a new \$ai_generation event"
