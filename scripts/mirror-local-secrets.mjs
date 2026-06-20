#!/usr/bin/env node

import fs from "node:fs/promises";
import { ensureParentDir } from "./lib/dotenv-utils.mjs";
import { INFISICAL_CONFIG } from "./lib/secrets-config.mjs";

function parseTarget(argv) {
  const target = argv[0] || "all";
  if (!["dev", "prod", "all"].includes(target)) {
    throw new Error("Usage: node scripts/mirror-local-secrets.mjs [dev|prod|all]");
  }

  return target;
}

async function copyFile(source, destination) {
  await ensureParentDir(destination);
  await fs.copyFile(source, destination);
  console.log(`Mirrored ${source} -> ${destination}`);
}

async function main() {
  const target = parseTarget(process.argv.slice(2));
  const environments =
    target === "all"
      ? Object.values(INFISICAL_CONFIG.environments)
      : [INFISICAL_CONFIG.environments[target]];

  for (const envConfig of environments) {
    await copyFile(envConfig.workingFile, envConfig.localMirrorFile);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
