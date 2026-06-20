# Chronicle Development Campaign

Party Quest campaign for Chronicle on Forgejo, using the **shared** phantasy-development agent fleet (ports 2300–2303).

## Canonical source

- **Forgejo**: `https://forgejo.phantasy.bot/chronicle/chronicle`
- **GitHub mirror**: `https://github.com/lightnolimit/chronicle`

## Squad map (shared Phantasy runtime)

| Squad     | Phantasy agent config | Party Quest framework id  | Port |
| --------- | --------------------- | ------------------------- | ---- |
| Marketing | `phantasy-marketing`  | `phantasy-phantasy-agent` | 2300 |
| Research  | `phantasy-research`   | `phantasy-hermes-agent`   | 2301 |
| Debug     | `phantasy-debug`      | `phantasy-openclaw-agent` | 2302 |
| Code      | `phantasy-code`       | `phantasy-opencode-agent` | 2303 |

Quest commands run in `~/chronicle-ops/chronicle` (Forgejo clone). Agent credentials reuse `~/phantasy-ops/workspaces/env/*.env`.

## Forgejo setup

```bash
FORGEJO_TOKEN=<admin> GITHUB_TOKEN=<token> node scripts/setup-forgejo-ops.mjs
```

## Party Quest seed (on Spectre)

```bash
bash examples/chronicle-development/spectre/redeploy-party-quest-seed.sh
```

Or manually after patch is applied to `~/party-quest/convex/seed.ts`:

```bash
cd ~/party-quest
docker compose -f docker-compose.spectre.yml --env-file .env.self-hosted run --rm \
  -e CONVEX_SELF_HOSTED_URL=http://party-quest-convex-1:3210 convex-deploy \
  npx convex run seed:seedChronicleDevelopment
```

## Spectre bootstrap

```bash
bash examples/chronicle-development/spectre/bootstrap-campaign.sh
```

## Smoke gate

```bash
PARTY_QUEST_URL=http://<convex-container-ip>:3211 \
  CHRONICLE_REPO=~/chronicle-ops/chronicle \
  node scripts/dogfood-party-quest-chronicle.mjs --reseed
```

Evidence: `evidence/party-quest/chronicle-development-smoke-YYYY-MM-DD.jsonl`