import { UploadService } from '../services/upload.js';
import type { UploadResponse, UploadOptions } from '../types/index.js';

export class UploadMarkdownHandler {
  private uploadService: UploadService;

  constructor(evmPrivateKey: string) {
    this.uploadService = new UploadService(evmPrivateKey);
  }

  async handle(data: string, encrypted: boolean = false, cipherIv?: string): Promise<UploadResponse> {
    const options: UploadOptions = {
      data,
      contentType: 'text/markdown',
      encrypted,
      cipherIv,
      tags: [
        { name: 'Type', value: 'markdown' },
        { name: 'Service', value: 'CHRONICLE' },
      ],
    };

    return this.uploadService.upload(options);
  }
}