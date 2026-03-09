import {
  baseAcpConfigV2,
  baseSepoliaAcpConfigV2,
  type AcpContractConfig,
} from "@virtuals-protocol/acp-node";

export type AcpNetwork = "base" | "base-sepolia";

export interface ACPRuntimeConfig {
  enabled: boolean;
  network: AcpNetwork;
  walletPrivateKey?: `0x${string}`;
  sessionEntityKeyId?: number;
  agentWalletAddress?: `0x${string}`;
  builderCode?: string;
  queueDepth: number;
  concurrency: {
    storage: number;
    text: number;
    image: number;
    video: number;
  };
  sdkConfig: AcpContractConfig;
  usingLegacyWalletKey: boolean;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getAcpRuntimeConfig(): ACPRuntimeConfig {
  const network = (process.env.ACP_NETWORK ||
    process.env.NETWORK ||
    "base") as AcpNetwork;
  const baseConfig =
    network === "base-sepolia" ? baseSepoliaAcpConfigV2 : baseAcpConfigV2;
  const walletPrivateKey =
    process.env.ACP_WHITELISTED_WALLET_PRIVATE_KEY || process.env.EVM_PRIVATE_KEY;

  return {
    enabled: process.env.ACP_ENABLED === "true",
    network,
    walletPrivateKey: walletPrivateKey as `0x${string}` | undefined,
    sessionEntityKeyId: process.env.ACP_SESSION_KEY_ID
      ? Number.parseInt(process.env.ACP_SESSION_KEY_ID, 10)
      : undefined,
    agentWalletAddress: process.env.ACP_AGENT_WALLET as `0x${string}` | undefined,
    builderCode: process.env.ACP_BUILDER_CODE || undefined,
    queueDepth: parsePositiveInt(process.env.ACP_QUEUE_DEPTH, 10),
    concurrency: {
      storage: parsePositiveInt(process.env.ACP_CONCURRENCY_STORAGE, 2),
      text: parsePositiveInt(process.env.ACP_CONCURRENCY_TEXT, 2),
      image: parsePositiveInt(process.env.ACP_CONCURRENCY_IMAGE, 1),
      video: parsePositiveInt(process.env.ACP_CONCURRENCY_VIDEO, 1),
    },
    sdkConfig: {
      ...baseConfig,
      rpcEndpoint: process.env.ACP_RPC_URL || baseConfig.rpcEndpoint,
    },
    usingLegacyWalletKey:
      !process.env.ACP_WHITELISTED_WALLET_PRIVATE_KEY && !!process.env.EVM_PRIVATE_KEY,
  };
}

export function getMissingAcpConfigFields(config: ACPRuntimeConfig): string[] {
  const missing: string[] = [];

  if (!config.walletPrivateKey) {
    missing.push("ACP_WHITELISTED_WALLET_PRIVATE_KEY");
  }
  if (!config.sessionEntityKeyId) {
    missing.push("ACP_SESSION_KEY_ID");
  }
  if (!config.agentWalletAddress) {
    missing.push("ACP_AGENT_WALLET");
  }

  return missing;
}
