import type { UploadType } from "../types/index.js";

export interface AcpRequirementSchema {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required: string[];
  additionalProperties: boolean;
}

export interface AcpOfferingCatalogEntry {
  id: string;
  description: string;
  priceUsd: number;
  slaMinutes: number;
  enabled: boolean;
  requirementSchema: AcpRequirementSchema;
  deliverableShape: string;
  maxBytes?: number;
}

const enableImageOffering = process.env.ACP_ENABLE_IMAGE_OFFERING === "true";
const enableVideoOffering = process.env.ACP_ENABLE_VIDEO_OFFERING === "true";

const storageRequirementSchema: AcpRequirementSchema = {
  type: "object",
  properties: {
    data: {
      type: "string",
      description: "UTF-8 content or a base64/data URL payload for image uploads.",
    },
    type: {
      type: "string",
      enum: ["markdown", "json", "image"] satisfies UploadType[],
      description: "Payload type to persist.",
    },
    name: {
      type: "string",
      description: "Optional human-readable name stored in metadata tags.",
    },
    encrypted: {
      type: "boolean",
      description: "Whether the payload has already been encrypted client-side.",
    },
    cipherIv: {
      type: "string",
      description: "Cipher IV when encrypted is true.",
    },
  },
  required: ["data", "type"],
  additionalProperties: false,
};

const textRequirementSchema: AcpRequirementSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "Prompt to send to Chronicle's text generation model.",
    },
    max_tokens: {
      type: "number",
      minimum: 1,
      maximum: 4096,
      description: "Optional output token cap.",
    },
    temperature: {
      type: "number",
      minimum: 0,
      maximum: 2,
      description: "Optional decoding temperature.",
    },
  },
  required: ["prompt"],
  additionalProperties: false,
};

const imageRequirementSchema: AcpRequirementSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "Image generation prompt.",
    },
    width: {
      type: "number",
      enum: [512, 1024],
      description: "Optional output width.",
    },
    height: {
      type: "number",
      enum: [512, 1024],
      description: "Optional output height.",
    },
  },
  required: ["prompt"],
  additionalProperties: false,
};

const videoRequirementSchema: AcpRequirementSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "Video generation prompt.",
    },
    image_b64: {
      type: "string",
      description: "Base64 or data URL image used as the starting frame.",
    },
    guidance_scale: {
      type: "number",
      description: "Optional guidance scale.",
    },
    negative_prompt: {
      type: "string",
      description: "Optional negative prompt.",
    },
  },
  required: ["prompt", "image_b64"],
  additionalProperties: false,
};

export const ACP_OFFERING_CATALOG: readonly AcpOfferingCatalogEntry[] = [
  {
    id: "chronicle_store_64kb",
    description: "Persist markdown, JSON, or image payloads up to 64KB on Arweave and return a durable URL.",
    priceUsd: 0.09,
    slaMinutes: 5,
    enabled: true,
    requirementSchema: storageRequirementSchema,
    deliverableShape: "{ id, url, type, encrypted, bytesStored, tier, timestamp }",
    maxBytes: 64 * 1024,
  },
  {
    id: "chronicle_store_256kb",
    description: "Persist markdown, JSON, or image payloads up to 256KB on Arweave and return a durable URL.",
    priceUsd: 0.36,
    slaMinutes: 10,
    enabled: true,
    requirementSchema: storageRequirementSchema,
    deliverableShape: "{ id, url, type, encrypted, bytesStored, tier, timestamp }",
    maxBytes: 256 * 1024,
  },
  {
    id: "chronicle_ai_text",
    description: "Generate text with Chronicle's hosted model and return the response body.",
    priceUsd: 0.07,
    slaMinutes: 5,
    enabled: true,
    requirementSchema: textRequirementSchema,
    deliverableShape: "{ text, timestamp }",
  },
  {
    id: "chronicle_ai_image",
    description: "Generate an image, persist the final asset, and return a stable URL plus metadata.",
    priceUsd: 0.13,
    slaMinutes: 10,
    enabled: enableImageOffering,
    requirementSchema: imageRequirementSchema,
    deliverableShape: "{ assetId, url, width, height, timestamp }",
  },
  {
    id: "chronicle_ai_video",
    description: "Generate a short video, persist the final asset when possible, and return a URL plus metadata.",
    priceUsd: 1.25,
    slaMinutes: 20,
    enabled: enableVideoOffering,
    requirementSchema: videoRequirementSchema,
    deliverableShape: "{ assetId?, url, persistent, timestamp }",
  },
] as const;

export function getAcpCatalog(options?: { includeDisabled?: boolean }): AcpOfferingCatalogEntry[] {
  const includeDisabled = options?.includeDisabled ?? true;
  return ACP_OFFERING_CATALOG.filter((entry) => includeDisabled || entry.enabled).map((entry) => ({
    ...entry,
    requirementSchema: {
      ...entry.requirementSchema,
      properties: { ...entry.requirementSchema.properties },
      required: [...entry.requirementSchema.required],
    },
  }));
}

export function getAcpOfferingById(id: string): AcpOfferingCatalogEntry | undefined {
  return ACP_OFFERING_CATALOG.find((entry) => entry.id === id);
}
