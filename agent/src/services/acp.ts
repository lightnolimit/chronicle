import AcpClient, {
  AcpContractClientV2,
  AcpJob,
  AcpJobPhases,
  AcpMemo,
  type DeliverablePayload,
} from "@virtuals-protocol/acp-node";

import { getAcpOfferingById, type AcpOfferingCatalogEntry } from "../acp/catalog.js";
import { getAcpRuntimeConfig, getMissingAcpConfigFields, type ACPRuntimeConfig } from "../acp/config.js";
import { QueueFullError, TaskQueue } from "../acp/queue.js";
import { generateImage, generateText, generateVideo } from "../handlers/ai_generate.js";
import { recordUpload } from "./database.js";
import { UploadService } from "./upload.js";

type OfferingRequirements = Record<string, unknown>;

interface RuntimeOfferingHandler {
  validate: (requirements: OfferingRequirements, offering: AcpOfferingCatalogEntry) => void;
  execute: (
    requirements: OfferingRequirements,
    buyerAddress: string,
    offering: AcpOfferingCatalogEntry,
  ) => Promise<DeliverablePayload>;
}

function getContentType(type: unknown, data: string): string {
  if (type === "markdown") {
    return "text/markdown";
  }
  if (type === "image") {
    if (data.startsWith("data:")) {
      return data.match(/^data:([^;]+)/)?.[1] || "image/png";
    }
    return "image/png";
  }
  return "application/json";
}

function getPayloadSize(data: string | Uint8Array): number {
  return typeof data === "string" ? new TextEncoder().encode(data).length : data.length;
}

function normalizeBase64Asset(asset: string, fallbackContentType: string): { bytes: Uint8Array; contentType: string } {
  if (asset.startsWith("data:")) {
    const match = asset.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URL payload.");
    }
    return {
      contentType: match[1],
      bytes: Buffer.from(match[2], "base64"),
    };
  }

  return {
    contentType: fallbackContentType,
    bytes: Buffer.from(asset, "base64"),
  };
}

async function persistUploadedAsset(
  uploadService: UploadService,
  walletAddress: string,
  bytes: Uint8Array,
  contentType: string,
  priceUsd: number,
  type: "image" | "video",
  tags: { name: string; value: string }[],
): Promise<{ assetId: string; url: string; bytesStored: number }> {
  const result = await uploadService.upload({
    data: bytes,
    contentType,
    tags,
  });

  const bytesStored = bytes.length;
  recordUpload(walletAddress, result.id, result.url, type, false, bytesStored, priceUsd);

  return {
    assetId: result.id,
    url: result.url,
    bytesStored,
  };
}

function getQueueConcurrency(offeringId: string, config: ACPRuntimeConfig): number {
  if (offeringId.startsWith("chronicle_store_")) {
    return config.concurrency.storage;
  }
  if (offeringId === "chronicle_ai_text") {
    return config.concurrency.text;
  }
  if (offeringId === "chronicle_ai_image") {
    return config.concurrency.image;
  }
  if (offeringId === "chronicle_ai_video") {
    return config.concurrency.video;
  }
  return 1;
}

class ACPRuntime {
  private client: AcpClient | null = null;
  private config: ACPRuntimeConfig | null = null;
  private uploadService: UploadService | null = null;
  private queues = new Map<string, TaskQueue>();
  private isRunning = false;
  private handlers = new Map<string, RuntimeOfferingHandler>();

  initialize(config: ACPRuntimeConfig): void {
    this.config = config;
    this.uploadService = new UploadService(config.walletPrivateKey as string);
    this.handlers = this.createHandlers();
    this.queues = this.createQueues(config);
  }

  private createQueues(config: ACPRuntimeConfig): Map<string, TaskQueue> {
    const queues = new Map<string, TaskQueue>();

    for (const offeringId of this.handlers.keys()) {
      queues.set(
        offeringId,
        new TaskQueue(
          offeringId,
          getQueueConcurrency(offeringId, config),
          config.queueDepth,
        ),
      );
    }

    return queues;
  }

  private createHandlers(): Map<string, RuntimeOfferingHandler> {
    const handlers = new Map<string, RuntimeOfferingHandler>();

    handlers.set("chronicle_store_64kb", this.createStorageHandler());
    handlers.set("chronicle_store_256kb", this.createStorageHandler());
    handlers.set("chronicle_ai_text", this.createTextHandler());
    handlers.set("chronicle_ai_image", this.createImageHandler());
    handlers.set("chronicle_ai_video", this.createVideoHandler());

    return handlers;
  }

  private createStorageHandler(): RuntimeOfferingHandler {
    return {
      validate: (requirements, offering) => {
        const data = requirements.data;
        const type = requirements.type;
        const encrypted = requirements.encrypted;
        const cipherIv = requirements.cipherIv;

        if (typeof data !== "string" || !data) {
          throw new Error("Storage requests require a non-empty string data field.");
        }
        if (!["markdown", "json", "image"].includes(String(type))) {
          throw new Error("Storage requests require type to be markdown, json, or image.");
        }
        if (encrypted === true && typeof cipherIv !== "string") {
          throw new Error("cipherIv is required when encrypted is true.");
        }

        const bytes = getPayloadSize(data);
        if (offering.maxBytes && bytes > offering.maxBytes) {
          throw new Error(
            `Payload exceeds the ${offering.id} limit of ${offering.maxBytes} bytes.`,
          );
        }
      },
      execute: async (requirements, buyerAddress, offering) => {
        const data = requirements.data as string;
        const type = requirements.type as string;
        const encrypted = requirements.encrypted === true;
        const cipherIv =
          typeof requirements.cipherIv === "string" ? requirements.cipherIv : undefined;
        const name = typeof requirements.name === "string" ? requirements.name : "Untitled";
        const contentType = getContentType(type, data);

        const result = await this.uploadService!.upload({
          data,
          contentType,
          encrypted,
          cipherIv,
          tags: [
            { name: "Type", value: type },
            { name: "Service", value: "CHRONICLE" },
            { name: "Protocol", value: "ACP" },
            { name: "Document-Name", value: name },
            { name: "ACP-Tier", value: offering.id },
          ],
        });

        const bytesStored = getPayloadSize(data);
        recordUpload(
          buyerAddress,
          result.id,
          result.url,
          type,
          encrypted,
          bytesStored,
          offering.priceUsd,
        );

        return {
          id: result.id,
          url: result.url,
          type,
          encrypted,
          bytesStored,
          tier: offering.id,
          timestamp: Date.now(),
        };
      },
    };
  }

  private createTextHandler(): RuntimeOfferingHandler {
    return {
      validate: (requirements) => {
        if (typeof requirements.prompt !== "string" || !requirements.prompt.trim()) {
          throw new Error("Text generation requires a prompt.");
        }

        if (
          requirements.max_tokens !== undefined &&
          (typeof requirements.max_tokens !== "number" ||
            requirements.max_tokens < 1 ||
            requirements.max_tokens > 4096)
        ) {
          throw new Error("max_tokens must be a number between 1 and 4096.");
        }

        if (
          requirements.temperature !== undefined &&
          (typeof requirements.temperature !== "number" ||
            requirements.temperature < 0 ||
            requirements.temperature > 2)
        ) {
          throw new Error("temperature must be a number between 0 and 2.");
        }
      },
      execute: async (requirements, buyerAddress) => {
        const result = await generateText(
          {
            prompt: requirements.prompt as string,
            max_tokens: requirements.max_tokens as number | undefined,
            temperature: requirements.temperature as number | undefined,
          },
          buyerAddress,
        );

        return {
          text: result.text,
          timestamp: Date.now(),
        };
      },
    };
  }

  private createImageHandler(): RuntimeOfferingHandler {
    return {
      validate: (requirements) => {
        if (typeof requirements.prompt !== "string" || !requirements.prompt.trim()) {
          throw new Error("Image generation requires a prompt.");
        }
        for (const dimension of ["width", "height"] as const) {
          const value = requirements[dimension];
          if (value !== undefined && value !== 512 && value !== 1024) {
            throw new Error(`${dimension} must be either 512 or 1024 when provided.`);
          }
        }
      },
      execute: async (requirements, buyerAddress, offering) => {
        const result = await generateImage(
          {
            prompt: requirements.prompt as string,
            width: requirements.width as number | undefined,
            height: requirements.height as number | undefined,
          },
          buyerAddress,
        );

        const { bytes, contentType } = normalizeBase64Asset(result.image_b64, "image/png");
        const persisted = await persistUploadedAsset(
          this.uploadService!,
          buyerAddress,
          bytes,
          contentType,
          offering.priceUsd,
          "image",
          [
            { name: "Type", value: "image" },
            { name: "Service", value: "CHRONICLE" },
            { name: "Protocol", value: "ACP" },
            { name: "ACP-Tier", value: offering.id },
          ],
        );

        return {
          assetId: persisted.assetId,
          url: persisted.url,
          width: requirements.width ?? 1024,
          height: requirements.height ?? 1024,
          bytesStored: persisted.bytesStored,
          timestamp: Date.now(),
        };
      },
    };
  }

  private createVideoHandler(): RuntimeOfferingHandler {
    return {
      validate: (requirements) => {
        if (typeof requirements.prompt !== "string" || !requirements.prompt.trim()) {
          throw new Error("Video generation requires a prompt.");
        }
        if (typeof requirements.image_b64 !== "string" || !requirements.image_b64.trim()) {
          throw new Error("Video generation requires image_b64.");
        }
      },
      execute: async (requirements, buyerAddress, offering) => {
        const result = await generateVideo(
          {
            prompt: requirements.prompt as string,
            image_b64: requirements.image_b64 as string,
            guidance_scale: requirements.guidance_scale as number | undefined,
            negative_prompt: requirements.negative_prompt as string | undefined,
          },
          buyerAddress,
        );

        try {
          const response = await fetch(result.video_url);
          if (!response.ok) {
            throw new Error(`Video fetch failed with status ${response.status}.`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const persisted = await persistUploadedAsset(
            this.uploadService!,
            buyerAddress,
            bytes,
            response.headers.get("content-type") || "video/mp4",
            offering.priceUsd,
            "video",
            [
              { name: "Type", value: "video" },
              { name: "Service", value: "CHRONICLE" },
              { name: "Protocol", value: "ACP" },
              { name: "ACP-Tier", value: offering.id },
            ],
          );

          return {
            assetId: persisted.assetId,
            url: persisted.url,
            persistent: true,
            bytesStored: persisted.bytesStored,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.warn("[ACP] Falling back to provider video URL:", error);
          return {
            url: result.video_url,
            persistent: false,
            timestamp: Date.now(),
          };
        }
      },
    };
  }

  async start(): Promise<void> {
    if (!this.config || !this.config.walletPrivateKey || !this.config.sessionEntityKeyId || !this.config.agentWalletAddress) {
      throw new Error("ACP runtime not initialized. Call initialize() first.");
    }

    if (this.isRunning) {
      console.log("[ACP] Runtime already running");
      return;
    }

    const { walletPrivateKey, sessionEntityKeyId, agentWalletAddress, sdkConfig, usingLegacyWalletKey } =
      this.config;

    if (usingLegacyWalletKey) {
      console.warn(
        "[ACP] ACP_WHITELISTED_WALLET_PRIVATE_KEY is not set; falling back to EVM_PRIVATE_KEY.",
      );
    }

    const contractClient = await AcpContractClientV2.build(
      walletPrivateKey,
      sessionEntityKeyId,
      agentWalletAddress,
      sdkConfig,
    );

    this.client = new AcpClient({
      acpContractClient: contractClient,
      onNewTask: this.handleNewTask.bind(this),
      onEvaluate: this.handleEvaluate.bind(this),
    });

    await this.client.init();
    this.isRunning = true;

    console.log("[ACP] Runtime started successfully");
    console.log("[ACP] Agent wallet:", agentWalletAddress);
    console.log("[ACP] Enabled offerings:", [...this.handlers.keys()].join(", "));
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log("[ACP] Runtime stopped");
  }

  private async handleNewTask(job: AcpJob, memoToSign?: AcpMemo): Promise<void> {
    const offeringId = job.name || "";
    const buyerAddress = job.clientAddress;
    const offering = getAcpOfferingById(offeringId);
    const handler = this.handlers.get(offeringId);

    if (!offering || !offering.enabled || !handler) {
      console.error(`[ACP] Unknown or disabled offering: ${offeringId}`);
      await job.reject(`Unknown or disabled offering: ${offeringId}`);
      return;
    }

    if (!memoToSign) {
      console.log(`[ACP] No memo to sign for job ${job.id}; current phase ${job.phase}`);
      return;
    }

    try {
      if (
        job.phase === AcpJobPhases.REQUEST &&
        memoToSign.nextPhase === AcpJobPhases.NEGOTIATION
      ) {
        handler.validate(job.requirement as OfferingRequirements, offering);
        await job.accept("Chronicle accepted this request.");
        await job.createRequirement(
          `Accepted ${offeringId}. Chronicle will deliver ${offering.deliverableShape} within ${offering.slaMinutes} minute(s).`,
        );
        console.log(`[ACP] Job ${job.id} accepted for ${offeringId}`);
        return;
      }

      if (
        job.phase === AcpJobPhases.TRANSACTION &&
        memoToSign.nextPhase === AcpJobPhases.EVALUATION
      ) {
        const queue = this.queues.get(offeringId);
        if (!queue) {
          throw new Error(`Missing queue for offering ${offeringId}.`);
        }

        const deliverable = await queue.enqueue(async () =>
          handler.execute(job.requirement as OfferingRequirements, buyerAddress, offering),
        );
        await job.deliver(deliverable);
        console.log(`[ACP] Job ${job.id} delivered for ${offeringId}`);
        return;
      }

      console.log(
        `[ACP] Ignoring job ${job.id} phase ${job.phase} with next phase ${memoToSign.nextPhase}`,
      );
    } catch (error) {
      const message =
        error instanceof QueueFullError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Job execution failed";
      console.error(`[ACP] Job ${job.id} failed:`, message);
      await job.reject(message);
    }
  }

  private async handleEvaluate(job: AcpJob): Promise<void> {
    console.log(`[ACP] Evaluation requested for job ${job.id}`);
  }

  getStatus(): {
    running: boolean;
    queues: Array<{ label: string; concurrency: number; running: number; pending: number; maxDepth: number }>;
  } {
    return {
      running: this.isRunning,
      queues: [...this.queues.values()].map((queue) => queue.snapshot()),
    };
  }
}

export const acpRuntime = new ACPRuntime();

export async function startAcpRuntimeIfEnabled(): Promise<boolean> {
  const config = getAcpRuntimeConfig();

  if (!config.enabled) {
    console.log("[ACP] Runtime disabled");
    return false;
  }

  const missing = getMissingAcpConfigFields(config);
  if (missing.length > 0) {
    console.warn("[ACP] ACP_ENABLED but missing configuration:");
    for (const field of missing) {
      console.warn(`  - ${field}`);
    }
    return false;
  }

  acpRuntime.initialize(config);
  await acpRuntime.start();
  return true;
}

export async function startAcpRuntimeOrThrow(): Promise<void> {
  const config = getAcpRuntimeConfig();
  const missing = getMissingAcpConfigFields(config);

  if (missing.length > 0) {
    throw new Error(`Missing ACP configuration: ${missing.join(", ")}`);
  }

  acpRuntime.initialize(config);
  await acpRuntime.start();
}
