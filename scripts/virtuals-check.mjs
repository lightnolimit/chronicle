#!/usr/bin/env node

import fs from "node:fs/promises";
import { createPublicClient, getAddress, http, zeroAddress } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { parseDotenvObject } from "./lib/dotenv-utils.mjs";
import { INFISICAL_CONFIG } from "./lib/secrets-config.mjs";

function parseArgs(argv) {
  const target = argv[0];
  if (!["dev", "prod"].includes(target)) {
    throw new Error("Usage: node scripts/virtuals-check.mjs <dev|prod>");
  }

  return target;
}

function hasValue(env, key) {
  return typeof env[key] === "string" && env[key].trim().length > 0;
}

async function validateAcpOnChain(env) {
  if (
    !hasValue(env, "ACP_WHITELISTED_WALLET_PRIVATE_KEY") ||
    !hasValue(env, "ACP_SESSION_KEY_ID") ||
    !hasValue(env, "ACP_AGENT_WALLET") ||
    !hasValue(env, "ACP_RPC_URL")
  ) {
    return null;
  }

  const signerAbi = [
    {
      inputs: [
        { internalType: "uint32", name: "entityId", type: "uint32" },
        { internalType: "address", name: "account", type: "address" },
      ],
      name: "signers",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const privateKey = env.ACP_WHITELISTED_WALLET_PRIVATE_KEY.startsWith("0x")
    ? env.ACP_WHITELISTED_WALLET_PRIVATE_KEY
    : `0x${env.ACP_WHITELISTED_WALLET_PRIVATE_KEY}`;
  const signerAddress = privateKeyToAccount(privateKey).address;
  const entityId = Number.parseInt(env.ACP_SESSION_KEY_ID, 10);

  if (!Number.isFinite(entityId) || entityId <= 0) {
    return {
      ok: false,
      reason: "ACP_SESSION_KEY_ID must be a positive integer",
      signerAddress,
    };
  }

  const client = createPublicClient({
    chain: base,
    transport: http(env.ACP_RPC_URL),
  });

  const [registeredSigner, code] = await Promise.all([
    client.readContract({
      address: "0x00000000000099DE0BF6fA90dEB851E2A2df7d83",
      abi: signerAbi,
      functionName: "signers",
      args: [entityId, getAddress(env.ACP_AGENT_WALLET)],
    }),
    client.getCode({
      address: getAddress(env.ACP_AGENT_WALLET),
    }),
  ]);

  if (!code || code === "0x") {
    return {
      ok: false,
      reason: "ACP_AGENT_WALLET is not a deployed contract account on Base",
      signerAddress,
      entityId,
    };
  }

  if (registeredSigner.toLowerCase() === zeroAddress.toLowerCase()) {
    return {
      ok: false,
      reason: "No on-chain ACP signer is registered for ACP_SESSION_KEY_ID and ACP_AGENT_WALLET",
      signerAddress,
      entityId,
    };
  }

  if (registeredSigner.toLowerCase() !== signerAddress.toLowerCase()) {
    return {
      ok: false,
      reason: "ACP signer private key does not match the on-chain signer registered for this entity id",
      signerAddress,
      registeredSigner,
      entityId,
    };
  }

  return {
    ok: true,
    signerAddress,
    registeredSigner,
    entityId,
  };
}

async function main() {
  const target = parseArgs(process.argv.slice(2));
  const envConfig = INFISICAL_CONFIG.environments[target];
  const envText = await fs.readFile(envConfig.workingFile, "utf8");
  const env = parseDotenvObject(envText);

  const required = [];
  const recommended = [];

  const requireKey = (key, description) => {
    if (!hasValue(env, key)) {
      required.push(`${key}: ${description}`);
    }
  };

  const recommendKey = (key, description) => {
    if (!hasValue(env, key)) {
      recommended.push(`${key}: ${description}`);
    }
  };

  requireKey("EVM_PRIVATE_KEY", "required for Turbo-funded uploads");
  requireKey("EVM_ADDRESS", "required for x402 payment settlement");
  requireKey("NETWORK", "required for Chronicle API/x402 network selection");
  requireKey("AI_PROVIDER", "required for text offerings");
  requireKey("REDPILL_API_KEY", "required when AI_PROVIDER=redpill");
  requireKey("REDPILL_MODEL", "should remain deepseek/deepseek-v3.2 for current text setup");
  requireKey("ACP_ENABLED", "must be set to true for the seller runtime");
  requireKey("ACP_WHITELISTED_WALLET_PRIVATE_KEY", "required for ACP memo signing");
  requireKey("ACP_SESSION_KEY_ID", "returned by Virtuals service registry");
  requireKey("ACP_AGENT_WALLET", "returned by Virtuals service registry");
  requireKey("ACP_RPC_URL", "required to avoid unreliable default RPCs");
  recommendKey("AUTH_SECRET", "recommended dedicated auth/session signing secret");
  recommendKey("AUTH_ORIGIN", "recommended explicit Chronicle frontend origin");

  if (env.AI_PROVIDER !== "redpill") {
    required.push("AI_PROVIDER: expected `redpill` for the current text-only deployment");
  }
  if (env.REDPILL_MODEL !== "deepseek/deepseek-v3.2") {
    required.push("REDPILL_MODEL: expected `deepseek/deepseek-v3.2`");
  }
  if (env.ACP_ENABLED !== "true") {
    required.push("ACP_ENABLED: expected `true`");
  }
  if (env.ACP_NETWORK !== envConfig.expectedAcpNetwork) {
    required.push(`ACP_NETWORK: expected \`${envConfig.expectedAcpNetwork}\``);
  }
  if (env.NETWORK !== envConfig.expectedAcpNetwork) {
    required.push(`NETWORK: expected \`${envConfig.expectedAcpNetwork}\``);
  }
  if (env.ACP_ENABLE_IMAGE_OFFERING !== "false") {
    required.push("ACP_ENABLE_IMAGE_OFFERING: expected `false` while media offerings are disabled");
  }
  if (env.ACP_ENABLE_VIDEO_OFFERING !== "false") {
    required.push("ACP_ENABLE_VIDEO_OFFERING: expected `false` while media offerings are disabled");
  }

  const liveValidation = await validateAcpOnChain(env).catch((error) => ({
    ok: false,
    reason: `ACP live validation failed: ${error.message || String(error)}`,
  }));

  if (liveValidation && !liveValidation.ok) {
    required.push(`ACP live validation: ${liveValidation.reason}`);
  }

  console.log(`Chronicle Virtuals check: ${target}`);
  console.log(`Working file: ${envConfig.workingFile}`);

  if (required.length === 0) {
    console.log("Required status: READY");
  } else {
    console.log("Required status: NOT READY");
    for (const item of required) {
      console.log(`- ${item}`);
    }
  }

  if (recommended.length > 0) {
    console.log("\nRecommended:");
    for (const item of recommended) {
      console.log(`- ${item}`);
    }
  }

  if (liveValidation) {
    console.log("\nACP live validation:");
    if (liveValidation.ok) {
      console.log(`- entityId: ${liveValidation.entityId}`);
      console.log(`- signerAddress: ${liveValidation.signerAddress}`);
    } else {
      console.log(`- ${liveValidation.reason}`);
      if (liveValidation.entityId) {
        console.log(`- entityId: ${liveValidation.entityId}`);
      }
      if (liveValidation.signerAddress) {
        console.log(`- configuredSigner: ${liveValidation.signerAddress}`);
      }
      if (liveValidation.registeredSigner) {
        console.log(`- onChainSigner: ${liveValidation.registeredSigner}`);
      }
    }
  }

  if (required.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
