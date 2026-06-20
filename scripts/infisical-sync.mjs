#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {
  ensureParentDir,
  formatDotenvEntries,
  parseDotenv,
} from "./lib/dotenv-utils.mjs";
import { INFISICAL_CONFIG } from "./lib/secrets-config.mjs";

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = value;
    i += 1;
  }

  if (!command || !["pull", "push", "backup"].includes(command)) {
    throw new Error("Usage: node scripts/infisical-sync.mjs <pull|push|backup> --env <dev|prod> [--input <file>] [--output <file>]");
  }

  if (!options.env) {
    throw new Error("--env is required");
  }

  return { command, options };
}

function getDefaultPath(envName, command) {
  const envConfig = INFISICAL_CONFIG.environments[envName];
  if (command === "push") {
    return envConfig.workingFile;
  }

  if (command === "backup") {
    return envConfig.infisicalBackupFile;
  }

  return envConfig.workingFile;
}

function normalizeDomain(domain) {
  return domain.replace(/\/+$/, "");
}

function getCfHeaders() {
  const clientId = process.env.CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return {
      "CF-Access-Client-Id": clientId,
      "CF-Access-Client-Secret": clientSecret,
    };
  }

  return {};
}

async function authenticate(domain) {
  if (process.env.INFISICAL_ACCESS_TOKEN) {
    return process.env.INFISICAL_ACCESS_TOKEN;
  }

  const clientId = process.env.INFISICAL_MACHINE_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_MACHINE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Set INFISICAL_ACCESS_TOKEN or both INFISICAL_MACHINE_CLIENT_ID and INFISICAL_MACHINE_CLIENT_SECRET.",
    );
  }

  const response = await fetch(`${domain}/api/v1/auth/universal-auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCfHeaders(),
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Infisical auth failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  if (!data.accessToken) {
    throw new Error("Infisical auth response did not include an access token.");
  }

  return data.accessToken;
}

function getApiHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    ...getCfHeaders(),
  };
}

async function listSecrets({ domain, token, projectId, envName }) {
  const url = new URL(`${domain}/api/v3/secrets/raw`);
  url.searchParams.set("workspaceId", projectId);
  url.searchParams.set("environment", envName);
  url.searchParams.set("secretPath", INFISICAL_CONFIG.secretPath);
  url.searchParams.set("include_imports", "true");
  url.searchParams.set("type", INFISICAL_CONFIG.secretType);

  const response = await fetch(url, {
    headers: getApiHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Infisical list failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  return Array.isArray(data.secrets) ? data.secrets : [];
}

function formatDotenv(secrets) {
  return formatDotenvEntries(
    secrets.map((secret) => [secret.secretKey, secret.secretValue ?? ""]),
  );
}

async function createSecret({ domain, token, projectId, envName, key, value }) {
  const response = await fetch(`${domain}/api/v3/secrets/raw/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getApiHeaders(token),
    },
    body: JSON.stringify({
      workspaceId: projectId,
      environment: envName,
      secretValue: value,
      secretPath: INFISICAL_CONFIG.secretPath,
      type: INFISICAL_CONFIG.secretType,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Infisical create failed for ${key}: ${response.status} ${body}`);
  }
}

async function updateSecret({ domain, token, projectId, envName, key, value }) {
  const response = await fetch(`${domain}/api/v3/secrets/raw/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getApiHeaders(token),
    },
    body: JSON.stringify({
      workspaceId: projectId,
      environment: envName,
      secretValue: value,
      secretPath: INFISICAL_CONFIG.secretPath,
      type: INFISICAL_CONFIG.secretType,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Infisical update failed for ${key}: ${response.status} ${body}`);
  }
}

async function pullSecrets({ domain, token, projectId, envName, outputPath }) {
  const secrets = await listSecrets({ domain, token, projectId, envName });
  await ensureParentDir(outputPath);
  await fs.writeFile(outputPath, formatDotenv(secrets), "utf8");
  console.log(`Wrote ${secrets.length} secrets to ${outputPath}`);
}

async function pushSecrets({ domain, token, projectId, envName, inputPath }) {
  const text = await fs.readFile(inputPath, "utf8");
  const entries = parseDotenv(text);
  const existingSecrets = await listSecrets({ domain, token, projectId, envName });
  const existingKeys = new Set(existingSecrets.map((secret) => secret.secretKey));

  let created = 0;
  let updated = 0;

  for (const [key, value] of entries) {
    if (existingKeys.has(key)) {
      await updateSecret({ domain, token, projectId, envName, key, value });
      updated += 1;
    } else {
      await createSecret({ domain, token, projectId, envName, key, value });
      created += 1;
    }
  }

  console.log(
    `Synced ${entries.length} secrets to Infisical (${envName}): ${created} created, ${updated} updated`,
  );
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const envName = options.env;
  const domain = normalizeDomain(process.env.INFISICAL_DOMAIN || INFISICAL_CONFIG.domain);
  const projectId = process.env.INFISICAL_PROJECT_ID || INFISICAL_CONFIG.projectId;
  const token = await authenticate(domain);

  if (command === "push") {
    const inputPath = path.resolve(options.input || getDefaultPath(envName, command));
    await pushSecrets({ domain, token, projectId, envName, inputPath });
    return;
  }

  const outputPath = path.resolve(options.output || getDefaultPath(envName, command));
  await pullSecrets({ domain, token, projectId, envName, outputPath });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
