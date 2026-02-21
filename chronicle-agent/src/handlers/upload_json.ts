import { UploadService } from '../services/upload.js';
import type { UploadResponse, UploadOptions } from '../types/index.js';

export class UploadJsonHandler {
  private uploadService: UploadService;

  constructor(evmPrivateKey: string) {
    this.uploadService = new UploadService(evmPrivateKey);
  }

  async handle(data: string, encrypted: boolean = false, cipherIv?: string): Promise<UploadResponse> {
    let jsonData = data;
    
    if (!encrypted) {
      try {
        JSON.parse(data);
        jsonData = data;
      } catch {
        jsonData = JSON.stringify({ content: data });
      }
    }

    const options: UploadOptions = {
      data: jsonData,
      contentType: 'application/json',
      encrypted,
      cipherIv,
      tags: [
        { name: 'Type', value: 'json' },
        { name: 'Service', value: 'CHRONICLE' },
      ],
    };

    return this.uploadService.upload(options);
  }
}