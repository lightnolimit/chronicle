#!/usr/bin/env node
/**
 * Verify Forgejo push mirror has no last_error (operator token required).
 *
 * Env: FORGEJO_TOKEN, FORGEJO_REPO (owner/repo), FORGEJO_BASE_URL
 */

const forgejoBase = (
  process.env.FORGEJO_BASE_URL || "https://forgejo.phantasy.bot"
).replace(/\/$/, "");
const forgejoRepo = process.env.FORGEJO_REPO?.trim();
const forgejoToken = (
  process.env.FORGEJO_MIRROR_TOKEN ||
  process.env.FORGEJO_ADMIN_TOKEN ||
  process.env.FORGEJO_TOKEN
)?.trim();
const forgejoUser = process.env.FORGEJO_ADMIN_USER?.trim() || "phantasy";

async function main() {
  if (!forgejoRepo || !forgejoToken) {
    throw new Error("FORGEJO_REPO and FORGEJO_TOKEN are required");
  }
  const response = await fetch(`${forgejoBase}/api/v1/repos/${forgejoRepo}/push_mirrors`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${forgejoUser}:${forgejoToken}`).toString("base64")}`,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Mirror API failed: ${JSON.stringify(body)}`);
  }
  const mirror = Array.isArray(body)
    ? body.find((entry) => entry.remote_address?.includes("github.com"))
    : null;
  if (!mirror) {
    throw new Error(`No GitHub push mirror configured for ${forgejoRepo}`);
  }
  if (mirror.last_error?.trim()) {
    throw new Error(`Mirror error for ${forgejoRepo}: ${mirror.last_error.slice(0, 400)}`);
  }
  process.stdout.write(
    JSON.stringify({ ok: true, repo: forgejoRepo, remoteName: mirror.remote_name }) + "\n",
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});