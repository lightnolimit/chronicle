#!/usr/bin/env node
/**
 * Run Chronicle development smokes for all four shared Phantasy agents.
 *
 * Flags: --dry-run, --reseed, --accept-any, --claim-only, --skip-exec
 */

import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AGENTS = [
  "phantasy-marketing",
  "phantasy-research",
  "phantasy-debug",
  "phantasy-code",
];

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.env.CHRONICLE_REPO || join(scriptDir, ".."));
const envDir = resolve(
  process.env.PHANTASY_AGENT_ENV_DIR || join(homedir(), "phantasy-ops/workspaces/env"),
);
const smokeScript = join(repoRoot, "scripts/smoke-party-quest-chronicle.mjs");
const day = new Date().toISOString().slice(0, 10);
const evidenceDir = join(repoRoot, "evidence", "party-quest");
const evidenceJsonl =
  process.env.SMOKE_EVIDENCE_JSONL?.trim() ||
  join(evidenceDir, `chronicle-development-smoke-${day}.jsonl`);

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const reseedEach = argv.includes("--reseed");
const extraArgs = argv.filter(
  (arg) => !["--reseed", "--dry-run", "--help", "-h"].includes(arg),
);
const partyQuestDir =
  process.env.PARTY_QUEST_DIR?.trim() || join(homedir(), "party-quest");

function reseedQuests() {
  if (!reseedEach) return;
  process.stdout.write("Reseeding chronicle-development quests...\n");
  const result = spawnSync(
    "bash",
    [
      "-lc",
      `cd "${partyQuestDir}" && docker compose -f docker-compose.spectre.yml --env-file .env.self-hosted run --rm -e CONVEX_SELF_HOSTED_URL=http://party-quest-convex-1:3210 convex-deploy npx convex run seed:seedChronicleDevelopment`,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "reseed failed\n");
    throw new Error("Quest re-seed failed");
  }
}

function runAgent(agentId) {
  const credentialsEnv = join(envDir, `${agentId}.env`);
  process.stdout.write(`\n=== ${agentId} ===\n`);
  const smokeArgs = ["--accept-any", ...extraArgs];
  if (agentId === "phantasy-debug") {
    smokeArgs.push("--claim-only");
  }
  const result = spawnSync(process.execPath, [smokeScript, ...smokeArgs], {
      cwd: repoRoot,
      env: {
        ...process.env,
        AGENT: agentId,
        CHRONICLE_REPO: repoRoot,
        CAMPAIGN_SLUG: "chronicle-development",
        CREDENTIALS_ENV: credentialsEnv,
        SMOKE_EVIDENCE_JSONL: evidenceJsonl,
        ACCEPT_ANY_QUEST: "1",
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status ?? 1;
}

mkdirSync(evidenceDir, { recursive: true });

if (dryRun) {
  process.stdout.write(
    JSON.stringify(
      { dryRun: true, repoRoot, envDir, evidenceJsonl, agents: AGENTS },
      null,
      2,
    ) + "\n",
  );
  process.exit(0);
}

if (reseedEach) reseedQuests();

let failures = 0;
for (const agent of AGENTS) {
  if (runAgent(agent) !== 0) failures += 1;
}

process.stdout.write(`\nEvidence: ${evidenceJsonl}\n`);
process.exit(failures > 0 ? 1 : 0);