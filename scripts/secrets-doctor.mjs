#!/usr/bin/env node

import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  compareDotenvMaps,
  readDotenvFile,
} from "./lib/dotenv-utils.mjs";
import { INFISICAL_AUTH_ENV, INFISICAL_CONFIG } from "./lib/secrets-config.mjs";

const execFileAsync = promisify(execFile);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isGitIgnored(filePath) {
  try {
    await execFileAsync("git", ["check-ignore", "-q", filePath], {
      cwd: process.cwd(),
    });
    return true;
  } catch (error) {
    if (typeof error.code === "number" && error.code === 1) {
      return false;
    }

    throw error;
  }
}

async function inspectEnvironment(envConfig) {
  const result = {
    name: envConfig.name,
    workingFile: envConfig.workingFile,
    localMirrorFile: envConfig.localMirrorFile,
    infisicalBackupFile: envConfig.infisicalBackupFile,
    files: {},
    ignore: {},
    comparisons: {},
  };

  const paths = [
    envConfig.workingFile,
    envConfig.localMirrorFile,
    envConfig.infisicalBackupFile,
  ];

  for (const filePath of paths) {
    result.files[filePath] = await fileExists(filePath);
    result.ignore[filePath] = await isGitIgnored(filePath);
  }

  if (result.files[envConfig.workingFile] && result.files[envConfig.localMirrorFile]) {
    const working = await readDotenvFile(envConfig.workingFile);
    const localMirror = await readDotenvFile(envConfig.localMirrorFile);
    result.comparisons.localMirror = compareDotenvMaps(working, localMirror);
  }

  if (result.files[envConfig.workingFile] && result.files[envConfig.infisicalBackupFile]) {
    const working = await readDotenvFile(envConfig.workingFile);
    const backup = await readDotenvFile(envConfig.infisicalBackupFile);
    result.comparisons.infisicalBackup = compareDotenvMaps(working, backup);
  }

  return result;
}

function comparisonIsClean(comparison) {
  if (!comparison) {
    return false;
  }

  return (
    comparison.missing.length === 0 &&
    comparison.extra.length === 0 &&
    comparison.changed.length === 0
  );
}

function printEnvironmentReport(report) {
  console.log(`\n[${report.name}]`);
  console.log(`working: ${report.workingFile} ${report.files[report.workingFile] ? "present" : "missing"} ${report.ignore[report.workingFile] ? "(gitignored)" : "(NOT gitignored)"}`);
  console.log(`local mirror: ${report.localMirrorFile} ${report.files[report.localMirrorFile] ? "present" : "missing"} ${report.ignore[report.localMirrorFile] ? "(gitignored)" : "(NOT gitignored)"}`);
  console.log(`Infisical snapshot: ${report.infisicalBackupFile} ${report.files[report.infisicalBackupFile] ? "present" : "missing"} ${report.ignore[report.infisicalBackupFile] ? "(gitignored)" : "(NOT gitignored)"}`);

  if (report.comparisons.localMirror) {
    console.log(`local mirror sync: ${comparisonIsClean(report.comparisons.localMirror) ? "OK" : "DRIFT"}`);
  }

  if (report.comparisons.infisicalBackup) {
    console.log(`Infisical snapshot sync: ${comparisonIsClean(report.comparisons.infisicalBackup) ? "OK" : "DRIFT"}`);
  }
}

async function main() {
  const reports = await Promise.all(
    Object.values(INFISICAL_CONFIG.environments).map(inspectEnvironment),
  );

  const hasInfisicalAuth =
    Boolean(process.env.INFISICAL_ACCESS_TOKEN) ||
    (Boolean(process.env.INFISICAL_MACHINE_CLIENT_ID) &&
      Boolean(process.env.INFISICAL_MACHINE_CLIENT_SECRET));
  const hasCloudflareAccess =
    Boolean(process.env.CF_ACCESS_CLIENT_ID) &&
    Boolean(process.env.CF_ACCESS_CLIENT_SECRET);

  console.log("Chronicle secrets doctor");
  console.log(`Infisical auth env loaded: ${hasInfisicalAuth ? "yes" : "no"}`);
  console.log(`Cloudflare Access env loaded: ${hasCloudflareAccess ? "yes" : "no"}`);

  for (const report of reports) {
    printEnvironmentReport(report);
  }

  const problems = [];
  const warnings = [];

  for (const report of reports) {
    for (const [filePath, isIgnored] of Object.entries(report.ignore)) {
      if (!isIgnored) {
        problems.push(`${filePath} is not gitignored`);
      }
    }

    if (!report.files[report.workingFile]) {
      problems.push(`${report.workingFile} is missing`);
    }
    if (!report.files[report.localMirrorFile]) {
      problems.push(`${report.localMirrorFile} is missing`);
    }
    if (!report.files[report.infisicalBackupFile]) {
      problems.push(`${report.infisicalBackupFile} is missing`);
    }

    if (report.comparisons.localMirror && !comparisonIsClean(report.comparisons.localMirror)) {
      problems.push(`${report.name} local mirror is out of sync`);
    }
    if (
      report.comparisons.infisicalBackup &&
      !comparisonIsClean(report.comparisons.infisicalBackup)
    ) {
      problems.push(`${report.name} Infisical snapshot is out of sync`);
    }
  }

  if (!hasInfisicalAuth) {
    const authNames = INFISICAL_AUTH_ENV.map((entry) => entry.name).join(", ");
    warnings.push(`Infisical auth env is not loaded in this shell (${authNames})`);
  } else if (!hasCloudflareAccess) {
    warnings.push("Cloudflare Access env is not loaded in this shell");
  }

  if (problems.length > 0) {
    console.error("\nProblems:");
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  console.log("\nStatus: OK");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
