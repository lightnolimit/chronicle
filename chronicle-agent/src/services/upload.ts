import { TurboFactory, X402Funding, EthereumSigner } from '@ardrive/turbo-sdk';
import type { UploadOptions, UploadResponse } from '../types/index.js';
import { pricingService } from './pricing.js';

export class UploadService {
  private signer: EthereumSigner;
  private token: 'base-usdc' | 'usdc' | 'ethereum' | 'arweave';

  constructor(evmPrivateKey: string, token: 'base-usdc' | 'usdc' | 'ethereum' | 'arweave' = 'base-usdc') {
    if (!evmPrivateKey) {
      throw new Error('EVM private key required for x402 payments');
    }

    this.signer = new EthereumSigner(evmPrivateKey);
    this.token = token;
  }

  async upload(options: UploadOptions): Promise<UploadResponse> {
    const { data, contentType, tags = [], encrypted, cipherIv } = options;

    const dataBytes = typeof data === 'string' 
      ? new TextEncoder().encode(data).length 
      : data.length;

    const pricing = await pricingService.getPrice(dataBytes);
    const maxPayment = Math.ceil(pricing.userPriceUsd * 1_000_000);

    const uploadTags = [
      { name: 'Content-Type', value: contentType },
      { name: 'App-Name', value: 'CHRONICLE' },
      { name: 'App-Version', value: '1.0.0' },
      ...tags,
    ];

    if (encrypted) {
      uploadTags.push(
        { name: 'Encrypted', value: 'true' },
        { name: 'Cipher', value: 'AES-256-GCM' }
      );
      if (cipherIv) {
        uploadTags.push({ name: 'Cipher-IV', value: cipherIv });
      }
    }

    const turbo = TurboFactory.authenticated({
      signer: this.signer,
      token: this.token,
    });

    const result = await turbo.upload({
      data,
      dataItemOpts: {
        tags: uploadTags,
      },
      fundingMode: new X402Funding({ maxMUSDCAmount: maxPayment }),
    });

    return {
      id: result.id,
      url: `https://arweave.net/${result.id}`,
      type: 'json',
      encrypted: encrypted || false,
      timestamp: Date.now(),
    };
  }

  static async uploadWithTurbo(
    data: string | Uint8Array,
    contentType: string,
    options?: {
      tags?: { name: string; value: string }[];
      encrypted?: boolean;
      cipherIv?: string;
      privateKey?: string;
      token?: 'base-usdc' | 'usdc' | 'ethereum' | 'arweave';
    }
  ): Promise<UploadResponse> {
    const { tags = [], encrypted, cipherIv, privateKey, token = 'ethereum' } = options || {};

    if (!privateKey) {
      throw new Error('Private key required for Turbo upload');
    }

    const signer = new EthereumSigner(privateKey);
    
    const turbo = TurboFactory.authenticated({
      signer,
      token,
    });

    const uploadTags = [
      { name: 'Content-Type', value: contentType },
      { name: 'App-Name', value: 'CHRONICLE' },
      { name: 'App-Version', value: '1.0.0' },
      ...tags,
    ];

    if (encrypted) {
      uploadTags.push(
        { name: 'Encrypted', value: 'true' },
        { name: 'Cipher', value: 'AES-256-GCM' }
      );
      if (cipherIv) {
        uploadTags.push({ name: 'Cipher-IV', value: cipherIv });
      }
    }

    const result = await turbo.upload({
      data,
      dataItemOpts: {
        tags: uploadTags,
      },
    });

    return {
      id: result.id,
      url: `https://arweave.net/${result.id}`,
      type: 'json',
      encrypted: encrypted || false,
      timestamp: Date.now(),
    };
  }
}