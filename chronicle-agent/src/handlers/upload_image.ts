import { UploadService } from '../services/upload.js';
import type { UploadResponse, UploadOptions } from '../types/index.js';

export class UploadImageHandler {
  private uploadService: UploadService;

  constructor(evmPrivateKey: string) {
    this.uploadService = new UploadService(evmPrivateKey);
  }

  async handle(data: string, encrypted: boolean = false, cipherIv?: string): Promise<UploadResponse> {
    let contentType = 'image/png';
    let uploadData: string | Uint8Array = data;

    if (data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        uploadData = this.base64ToUint8Array(match[2]);
      }
    } else if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length > 100) {
      uploadData = this.base64ToUint8Array(data);
    }

    const options: UploadOptions = {
      data: uploadData,
      contentType,
      encrypted,
      cipherIv,
      tags: [
        { name: 'Type', value: 'image' },
        { name: 'Service', value: 'CHRONICLE' },
      ],
    };

    return this.uploadService.upload(options);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}