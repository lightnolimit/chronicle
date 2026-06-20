#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import AcpClient, {
  AcpContractClientV2,
  AcpJobPhases,
  baseAcpConfigV2,
} from "@virtuals-protocol/acp-node";
import { parseDotenvObject } from "./lib/dotenv-utils.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const options = {
    pollMs: 5000,
    timeoutMs: 5 * 60 * 1000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = value;
    index += 1;
  }

  if (!options.providerWallet || !options.offering) {
    throw new Error(
      "Usage: node scripts/virtuals-buyer-smoke.mjs --providerWallet <0x...> --offering <offering-id> [--requirement-json '{...}'] [--requirement-file file.json] [--pollMs 5000] [--timeoutMs 300000]",
    );
  }

  return options;
}

async function loadRepoEnv() {
  const repoEnv = {};

  for (const filePath of [".env", ".env.phala"]) {
    try {
      const text = await fs.readFile(filePath, "utf8");
      Object.assign(repoEnv, parseDotenvObject(text));
    } catch {
      // ignore missing local env files
    }
  }

  return repoEnv;
}

async function loadRequirement(options) {
  if (options["requirement-json"]) {
    return JSON.parse(options["requirement-json"]);
  }

  if (options["requirement-file"]) {
    const filePath = path.resolve(options["requirement-file"]);
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  }

  if (options.offering === "chronicle_ai_text") {
    return {
      prompt: "Write one short sentence confirming Chronicle ACP text is working.",
      max_tokens: 64,
      temperature: 0.2,
    };
  }

  if (options.offering === "chronicle_store_64kb") {
    return {
      data: "# Chronicle ACP smoke test\n\nThis document confirms ACP storage is working.",
      type: "markdown",
      name: "chronicle-acp-smoke.md",
    };
  }

  if (options.offering === "chronicle_store_256kb") {
    return {
      data: JSON.stringify({ ok: true, source: "chronicle-acp-smoke" }),
      type: "json",
      name: "chronicle-acp-smoke.json",
    };
  }

  throw new Error(
    "No default requirement is defined for this offering. Pass --requirement-json or --requirement-file.",
  );
}

function getBuyerConfig(repoEnv) {
  const privateKey =
    process.env.ACP_BUYER_WALLET_PRIVATE_KEY || process.env.BUYER_ACP_WALLET_PRIVATE_KEY;
  const sessionKeyId =
    process.env.ACP_BUYER_SESSION_KEY_ID || process.env.BUYER_ACP_SESSION_KEY_ID;
  const agentWallet = process.env.ACP_BUYER_AGENT_WALLET || process.env.BUYER_ACP_AGENT_WALLET;
  const rpcUrl = process.env.ACP_BUYER_RPC_URL || process.env.BUYER_ACP_RPC_URL || repoEnv.ACP_RPC_URL;

  const missing = [];

  if (!privateKey) missing.push("ACP_BUYER_WALLET_PRIVATE_KEY");
  if (!sessionKeyId) missing.push("ACP_BUYER_SESSION_KEY_ID");
  if (!agentWallet) missing.push("ACP_BUYER_AGENT_WALLET");
  if (!rpcUrl) missing.push("ACP_BUYER_RPC_URL");

  if (missing.length > 0) {
    throw new Error(`Missing buyer ACP env: ${missing.join(", ")}`);
  }

  return {
    privateKey: privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    sessionKeyId: Number.parseInt(sessionKeyId, 10),
    agentWallet,
    rpcUrl,
  };
}

function phaseName(phase) {
  return Object.entries(AcpJobPhases).find(([, value]) => value === phase)?.[0] || String(phase);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoEnv = await loadRepoEnv();
  const buyer = getBuyerConfig(repoEnv);
  const requirement = await loadRequirement(options);

  const acpConfig = {
    ...baseAcpConfigV2,
    alchemyRpcUrl: buyer.rpcUrl,
    rpcEndpoint: buyer.rpcUrl,
  };

  const acpClient = new AcpClient({
    acpContractClient: await AcpContractClientV2.build(
      buyer.privateKey,
      buyer.sessionKeyId,
      buyer.agentWallet,
      acpConfig,
    ),
  });

  await acpClient.init(true);

  const providerAgent = await acpClient.getAgent(options.providerWallet, {
    showHiddenOfferings: true,
  });

  if (!providerAgent) {
    throw new Error(`Provider agent not found: ${options.providerWallet}`);
  }

  const offering = providerAgent.jobOfferings.find((entry) => entry.name === options.offering);
  if (!offering) {
    throw new Error(`Offering not found on provider: ${options.offering}`);
  }

  const jobId = await offering.initiateJob(requirement);
  const timeoutAt = Date.now() + Number.parseInt(String(options.timeoutMs), 10);
  const pollMs = Number.parseInt(String(options.pollMs), 10);

  let paid = false;
  let previousPhase = null;

  console.log(
    JSON.stringify(
      {
        stage: "job_created",
        jobId,
        providerWallet: options.providerWallet,
        offering: options.offering,
      },
      null,
      2,
    ),
  );

  while (Date.now() < timeoutAt) {
    const job = await acpClient.getJobById(jobId);
    if (!job) {
      await sleep(pollMs);
      continue;
    }

    if (job.phase !== previousPhase) {
      previousPhase = job.phase;
      console.log(
        JSON.stringify(
          {
            stage: "job_phase",
            jobId,
            phase: phaseName(job.phase),
            requirement: job.requirement ?? null,
          },
          null,
          2,
        ),
      );
    }

    if (job.phase === AcpJobPhases.NEGOTIATION && !paid) {
      await job.payAndAcceptRequirement("Chronicle ACP sandbox smoke test");
      paid = true;
      console.log(
        JSON.stringify(
          {
            stage: "job_paid",
            jobId,
          },
          null,
          2,
        ),
      );
    }

    if (job.phase === AcpJobPhases.COMPLETED) {
      const deliverable = await job.getDeliverable();
      console.log(
        JSON.stringify(
          {
            stage: "job_completed",
            jobId,
            deliverable,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (job.phase === AcpJobPhases.REJECTED || job.phase === AcpJobPhases.EXPIRED) {
      throw new Error(`Job ${jobId} ended in phase ${phaseName(job.phase)}`);
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for job ${jobId} to complete`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
