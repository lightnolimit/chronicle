#!/usr/bin/env node

import { createPublicClient, getAddress, http, parseAbiItem, zeroAddress } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const SIGNER_MODULE_ADDRESS = "0x00000000000099DE0BF6fA90dEB851E2A2df7d83";
const SIGNER_TRANSFERRED_EVENT = parseAbiItem(
  "event SignerTransferred(address indexed account, uint32 indexed entityId, address indexed newSigner, address previousSigner)",
);

function parseArgs(argv) {
  const options = {};

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

  if (!options.rpc || !options.agentWallet) {
    throw new Error(
      "Usage: node scripts/find-acp-entity-id.mjs --rpc <base-rpc-url> --agentWallet <0x...> [--signer <0x...> | --privateKey <0x...>] [--fromBlock <n>] [--step <n>] [--maxWindows <n>]",
    );
  }

  return options;
}

function parseBigIntOption(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = BigInt(value);
  if (parsed < 0n) {
    throw new Error(`Expected non-negative integer, received: ${value}`);
  }

  return parsed;
}

function parseIntegerOption(value, fallback, name) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected --${name} to be a positive integer, received: ${value}`);
  }

  return parsed;
}

async function findLogsInWindows(client, query, latestBlock, fromBlock, step, maxWindows) {
  let currentToBlock = latestBlock;
  let windowsSearched = 0;

  while (currentToBlock >= fromBlock && windowsSearched < maxWindows) {
    const currentFromBlock =
      currentToBlock - step + 1n > fromBlock ? currentToBlock - step + 1n : fromBlock;

    const logs = await client.getLogs({
      ...query,
      fromBlock: currentFromBlock,
      toBlock: currentToBlock,
    });

    if (logs.length > 0) {
      return {
        logs,
        windowsSearched: windowsSearched + 1,
        searchedFromBlock: currentFromBlock,
        searchedToBlock: currentToBlock,
      };
    }

    if (currentFromBlock === 0n) {
      break;
    }

    currentToBlock = currentFromBlock - 1n;
    windowsSearched += 1;
  }

  return {
    logs: [],
    windowsSearched,
    searchedFromBlock: fromBlock,
    searchedToBlock: latestBlock,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const agentWallet = getAddress(options.agentWallet);
  const signerAddress = options.signer
    ? getAddress(options.signer)
    : options.privateKey
      ? privateKeyToAccount(
          options.privateKey.startsWith("0x") ? options.privateKey : `0x${options.privateKey}`,
        ).address
      : null;

  const client = createPublicClient({
    chain: base,
    transport: http(options.rpc),
  });

  const latestBlock = await client.getBlockNumber();
  const fromBlock = parseBigIntOption(
    options.fromBlock,
    latestBlock > 500_000n ? latestBlock - 500_000n : 0n,
  );
  const step = parseBigIntOption(options.step, 10_000n);
  const maxWindows = parseIntegerOption(options.maxWindows, 100, "maxWindows");
  const maxEntityId = parseIntegerOption(options.maxEntityId, 4096, "maxEntityId");
  const batchSize = parseIntegerOption(options.batchSize, 256, "batchSize");

  let search;

  try {
    search = await findLogsInWindows(
      client,
      {
        address: SIGNER_MODULE_ADDRESS,
        event: SIGNER_TRANSFERRED_EVENT,
        args: {
          account: agentWallet,
          ...(signerAddress ? { newSigner: signerAddress } : {}),
        },
      },
      latestBlock,
      fromBlock,
      step,
      maxWindows,
    );
  } catch (error) {
    search = {
      logs: [],
      windowsSearched: 0,
      searchedFromBlock: fromBlock,
      searchedToBlock: latestBlock,
      logSearchError: error.message || String(error),
    };
  }

  const logs = search.logs;

  if (logs.length === 0) {
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

    const currentlyRegisteredEntityIds = [];
    const discoveredSigners = [];

    for (let startEntityId = 1; startEntityId <= maxEntityId; startEntityId += batchSize) {
      const endEntityId = Math.min(startEntityId + batchSize - 1, maxEntityId);
      const contracts = [];

      for (let entityId = startEntityId; entityId <= endEntityId; entityId += 1) {
        contracts.push({
          address: SIGNER_MODULE_ADDRESS,
          abi: signerAbi,
          functionName: "signers",
          args: [entityId, agentWallet],
        });
      }

      const results = await client.multicall({
        allowFailure: true,
        contracts,
      });

      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        if (result.status !== "success") {
          continue;
        }

        if (result.result.toLowerCase() === zeroAddress.toLowerCase()) {
          continue;
        }

        const entityId = startEntityId + index;
        const registeredSigner = result.result;

        discoveredSigners.push({
          entityId,
          signer: registeredSigner,
        });

        if (signerAddress && registeredSigner.toLowerCase() === signerAddress.toLowerCase()) {
          currentlyRegisteredEntityIds.push(entityId);
        }
      }
    }

    if (currentlyRegisteredEntityIds.length > 0) {
      console.log(
        JSON.stringify(
          {
            found: true,
            source: "on-chain-signers-scan",
            agentWallet,
            signerAddress,
            entityIds: currentlyRegisteredEntityIds,
            note: `Recovered from direct signers(entityId, account) reads over entity ids 1..${maxEntityId}.`,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (!signerAddress && discoveredSigners.length > 0) {
      console.log(
        JSON.stringify(
          {
            found: true,
            source: "on-chain-signers-scan",
            agentWallet,
            discoveredSigners,
            note: `Recovered all non-zero signers from direct signers(entityId, account) reads over entity ids 1..${maxEntityId}.`,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(
      JSON.stringify(
        {
          found: false,
          agentWallet,
          signerAddress,
          latestBlock: latestBlock.toString(),
          searchWindow: {
            fromBlock: fromBlock.toString(),
            toBlock: latestBlock.toString(),
            step: step.toString(),
            maxWindows,
            windowsSearched: search.windowsSearched,
          },
          discoveredSigners: signerAddress ? discoveredSigners : undefined,
          logSearchError: search.logSearchError ?? null,
          message: "No SignerTransferred event found for this agent wallet and signer address.",
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const entityIds = [...new Set(logs.map((log) => Number(log.args.entityId)))].sort(
    (left, right) => left - right,
  );

  console.log(
    JSON.stringify(
      {
        found: true,
        source: "SignerTransferred-event",
        agentWallet,
        signerAddress,
        entityIds,
        logCount: logs.length,
        latestBlock: latestBlock.toString(),
        searchWindow: {
          fromBlock: fromBlock.toString(),
          toBlock: latestBlock.toString(),
          step: step.toString(),
          maxWindows,
          windowsSearched: search.windowsSearched,
          matchedWindow: {
            fromBlock: search.searchedFromBlock.toString(),
            toBlock: search.searchedToBlock.toString(),
          },
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
