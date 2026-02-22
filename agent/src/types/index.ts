export type UploadType = 'image' | 'markdown' | 'json';

export interface UploadRequest {
  data: string;
  type: UploadType;
  encrypted?: boolean;
  cipherIv?: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  type: UploadType;
  encrypted: boolean;
  timestamp: number;
}

export interface PricingInfo {
  bytes: number;
  turboCostUsd: number;
  userPriceUsd: number;
  markupPercent: number;
}

export interface UploadOptions {
  data: string | Uint8Array;
  contentType: string;
  tags?: { name: string; value: string }[];
  encrypted?: boolean;
  cipherIv?: string;
}

export interface JobRequirements {
  data: string;
  type: UploadType;
  encrypted?: boolean;
  cipherIv?: string;
  walletAddress?: string;
}

export interface JobResult {
  id: string;
  url: string;
  type: UploadType;
  encrypted: boolean;
  timestamp: number;
}