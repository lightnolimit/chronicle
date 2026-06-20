#!/usr/bin/env node
/**
 * Create/configure Forgejo repo, enable Actions, and push mirror to GitHub.
 *
 * Environment:
 *   FORGEJO_TOKEN
 *   FORGEJO_BASE_URL — default https://forgejo.phantasy.bot
 *   FORGEJO_REPO     — default chronicle/chronicle
 *   GITHUB_TOKEN
 *   GITHUB_REPO      — default lightnolimit/chronicle
 */

const forgejoBase = (
  process.env.FORGEJO_BASE_URL || "https://forgejo.phantasy.bot"
).replace(/\/$/, "");
const forgejoRepo = process.env.FORGEJO_REPO || "chronicle/chronicle";
const githubRepo = process.env.GITHUB_REPO || "lightnolimit/chronicle";
const forgejoToken = process.env.FORGEJO_TOKEN?.trim();
const githubToken = process.env.GITHUB_TOKEN?.trim();
const forgejoAdminUser = process.env.FORGEJO_ADMIN_USER?.trim() || "phantasy";

async function forgejoApi(path, init = {}) {
  const response = await fetch(`${forgejoBase}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${forgejoAdminUser}:${forgejoToken}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(
      `Forgejo ${init.method || "GET"} ${path} failed: ${JSON.stringify(body)}`,
    );
    error.status = response.status;
    throw error;
  }
  return body;
}

async function githubApi(path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(
      `GitHub ${init.method || "GET"} ${path} failed: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function ensureForgejoRepo() {
  const [owner, repo] = forgejoRepo.split("/");
  try {
    const existing = await forgejoApi(`/repos/${owner}/${repo}`);
    if (!existing.has_actions) {
      await forgejoApi(`/repos/${owner}/${repo}`, {
        method: "PATCH",
        body: JSON.stringify({ has_actions: true }),
      });
      return { repo: "patched-actions", full_name: existing.full_name };
    }
    return { repo: "exists", full_name: existing.full_name };
  } catch (error) {
    const status = error?.status;
    const missing =
      status === 404 ||
      String(error?.message || "").includes("404") ||
      String(error?.message || "").includes("couldn't be found");
    if (!missing) {
      throw error;
    }
  }

  try {
    const created = await forgejoApi(`/orgs/${owner}/repos`, {
      method: "POST",
      body: JSON.stringify({
        name: repo,
        private: false,
        auto_init: false,
        has_actions: true,
      }),
    });
    return { repo: "created-org", full_name: created.full_name };
  } catch {
    const created = await forgejoApi("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: repo,
        private: false,
        auto_init: false,
        has_actions: true,
      }),
    });
    return { repo: "created-user", full_name: created.full_name };
  }
}

async function ensurePushMirror() {
  const [owner, repo] = forgejoRepo.split("/");
  const mirrors = await forgejoApi(`/repos/${owner}/${repo}/push_mirrors`);
  const target = `https://github.com/${githubRepo}.git`;
  const existing = Array.isArray(mirrors)
    ? mirrors.find((entry) => entry.remote_address?.includes("github.com"))
    : null;
  if (existing) {
    return { mirror: "exists", id: existing.id };
  }

  const remoteAddress = githubToken
    ? `https://x-access-token:${githubToken}@github.com/${githubRepo}.git`
    : target;

  const created = await forgejoApi(`/repos/${owner}/${repo}/push_mirrors`, {
    method: "POST",
    body: JSON.stringify({
      remote_address: remoteAddress,
      sync_on_commit: true,
      interval: "10m",
    }),
  });
  return { mirror: "created", id: created.id };
}

async function main() {
  if (!forgejoToken || !githubToken) {
    throw new Error("FORGEJO_TOKEN and GITHUB_TOKEN are required");
  }

  const results = {
    forgejoRepo: await ensureForgejoRepo(),
    pushMirror: await ensurePushMirror(),
  };

  console.log(JSON.stringify({ ok: true, ...results }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});