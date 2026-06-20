#!/usr/bin/env bash
set -euo pipefail

# Run on spectre.thomasjvu.com
#   bash ~/chronicle-ops/chronicle/examples/chronicle-development/spectre/bootstrap-campaign.sh

CHRONICLE_OPS="${CHRONICLE_OPS:-$HOME/chronicle-ops}"
CHRONICLE_REPO="${CHRONICLE_REPO:-$CHRONICLE_OPS/chronicle}"
PARTY_QUEST_DIR="${PARTY_QUEST_DIR:-$HOME/party-quest}"

echo "==> Ensure Chronicle Forgejo clone"
if [ ! -d "${CHRONICLE_REPO}/.git" ]; then
  mkdir -p "${CHRONICLE_OPS}"
  git clone https://forgejo.phantasy.bot/chronicle/chronicle.git "${CHRONICLE_REPO}"
fi
git -C "${CHRONICLE_REPO}" fetch origin main
git -C "${CHRONICLE_REPO}" checkout main
git -C "${CHRONICLE_REPO}" pull --ff-only origin main || true

echo "==> Install workspace deps for dogfood commands"
cd "${CHRONICLE_REPO}"
npm ci
npm ci --prefix agent

echo "==> Party Quest seed patch + deploy"
bash "${CHRONICLE_REPO}/examples/chronicle-development/spectre/redeploy-party-quest-seed.sh"

echo "==> Dogfood smoke (requires PARTY_QUEST_URL)"
if [ -n "${PARTY_QUEST_URL:-}" ]; then
  PARTY_QUEST_URL="${PARTY_QUEST_URL}" \
    CHRONICLE_REPO="${CHRONICLE_REPO}" \
    node "${CHRONICLE_REPO}/scripts/dogfood-party-quest-chronicle.mjs" --reseed
else
  CONVEX_IP="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' party-quest-convex-1 2>/dev/null | head -1)"
  if [ -n "${CONVEX_IP}" ]; then
    PARTY_QUEST_URL="http://${CONVEX_IP}:3211" \
      CHRONICLE_REPO="${CHRONICLE_REPO}" \
      node "${CHRONICLE_REPO}/scripts/dogfood-party-quest-chronicle.mjs" --reseed
  else
    echo "warn: set PARTY_QUEST_URL to run dogfood"
  fi
fi

echo "Done."