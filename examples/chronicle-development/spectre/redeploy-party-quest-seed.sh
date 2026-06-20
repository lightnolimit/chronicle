#!/usr/bin/env bash
set -euo pipefail

# Apply chronicle-development seed patch to Spectre party-quest and redeploy Convex.

PARTY_QUEST_DIR="${PARTY_QUEST_DIR:-$HOME/party-quest}"
CHRONICLE_REPO="${CHRONICLE_REPO:-$HOME/chronicle-ops/chronicle}"
SEED_FILE="${PARTY_QUEST_DIR}/convex/seed.ts"
PATCH_FILE="${CHRONICLE_REPO}/examples/chronicle-development/party-quest-seed-patch.ts"

if [ ! -f "${PATCH_FILE}" ]; then
  echo "error: missing patch file ${PATCH_FILE}"
  exit 1
fi

if ! grep -q 'seedChronicleDevelopment' "${SEED_FILE}"; then
  echo "==> Appending chronicle seed patch to ${SEED_FILE}"
  printf '\n' >> "${SEED_FILE}"
  cat "${PATCH_FILE}" >> "${SEED_FILE}"
else
  echo "==> seedChronicleDevelopment already present in ${SEED_FILE}"
fi

cd "${PARTY_QUEST_DIR}"
docker compose -f docker-compose.spectre.yml --env-file .env.self-hosted up --build -d convex-deploy

deploy_ready=false
for _ in $(seq 1 90); do
  if docker logs party-quest-convex-deploy-1 2>&1 | grep -q "Deployed Convex functions"; then
    deploy_ready=true
    break
  fi
  sleep 2
done
if [ "${deploy_ready}" != "true" ]; then
  echo "error: convex-deploy did not finish within 180s" >&2
  docker logs party-quest-convex-deploy-1 2>&1 | tail -40 >&2 || true
  exit 1
fi

echo "==> Deploy chronicle-development seed"
docker compose -f docker-compose.spectre.yml --env-file .env.self-hosted run --rm \
  -e CONVEX_SELF_HOSTED_URL=http://party-quest-convex-1:3210 convex-deploy \
  npx convex run seed:seedChronicleDevelopment

echo "Done."