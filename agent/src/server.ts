import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator } from '@payai/facilitator';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { getUserUploads, getUserUploadCount, exportUploadsJson, exportUploadsCsv, recordUpload } from '../src/services/database.js';
import { UploadService } from '../src/services/upload.js';

const app = express();
app.use(cors({
  exposedHeaders: ['payment-required', 'payment-response', 'PAYMENT-SIGNATURE'],
}));
app.use(express.json({ limit: '10mb' }));

const AUTH_HEADER = process.env.API_AUTH_HEADER || 'authorization';
const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;
const EVM_ADDRESS = process.env.EVM_ADDRESS as string;
const NETWORK = process.env.NETWORK || 'base-sepolia';

const networkChainId = NETWORK === 'base' ? 'eip155:8453' : 'eip155:84532';

const facilitatorClient = new HTTPFacilitatorClient(facilitator);
const x402Server = new x402ResourceServer(facilitatorClient);
x402Server.register(networkChainId, new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      'POST /api/upload': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',
            network: networkChainId,
            payTo: EVM_ADDRESS,
          },
        ],
        description: 'Upload document to Arweave via Turbo',
        mimeType: 'application/json',
      },
    },
    x402Server,
  ),
);

function authenticate(req: express.Request): string | null {
  const auth = req.headers[AUTH_HEADER.toLowerCase()] as string;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  
  const parts = auth.slice(7).split(':');
  if (parts.length !== 2) {
    return null;
  }
  
  return parts[0];
}

app.post('/api/upload', async (req, res) => {
  const walletAddress = authenticate(req);
  if (!walletAddress) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Missing or invalid authorization header' });
  }

  const { data, type, name, encrypted } = req.body;

  if (!data || !type) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing data or type' });
  }

  if (!EVM_PRIVATE_KEY) {
    return res.status(500).json({ error: 'SERVER_NOT_CONFIGURED', message: 'Server not configured for uploads' });
  }

  try {
    const uploadService = new UploadService(EVM_PRIVATE_KEY);
    
    let contentType: string;
    if (type === 'markdown') {
      contentType = 'text/markdown';
    } else if (type === 'image') {
      // Extract content type from data URL if present
      if (data.startsWith('data:')) {
        const match = data.match(/^data:([^;]+)/);
        contentType = match ? match[1] : 'image/png';
      } else {
        contentType = 'image/png';
      }
    } else {
      contentType = 'application/json';
    }

    const result = await uploadService.upload({
      data,
      contentType,
      encrypted: encrypted || false,
      tags: [
        { name: 'Type', value: type },
        { name: 'Service', value: 'CHRONICLE' },
        { name: 'Document-Name', value: name || 'Untitled' },
      ],
    });

    const sizeBytes = new TextEncoder().encode(data).length;
    const priceUsd = calculatePrice(sizeBytes);

    recordUpload(
      walletAddress,
      result.id,
      result.url,
      type,
      result.encrypted || false,
      sizeBytes,
      priceUsd
    );

    res.json({
      success: true,
      id: result.id,
      url: result.url,
      priceUsd,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'UPLOAD_FAILED', message: error.message || 'Upload failed' });
  }
});

function calculatePrice(sizeBytes: number): number {
  const basePrice = 0.01;
  const pricePerByte = 0.0000001;
  const calculated = basePrice + (sizeBytes * pricePerByte);
  return Math.round(calculated * 100) / 100;
}

app.get('/api/price', (req, res) => {
  const { size } = req.query;
  const sizeBytes = parseInt(size as string) || 0;
  const priceUsd = calculatePrice(sizeBytes);
  res.json({ priceUsd, sizeBytes });
});

app.get('/api/uploads', (req, res) => {
  const walletAddress = authenticate(req);
  if (!walletAddress) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Missing or invalid authorization header' });
  }
  
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  
  const uploads = getUserUploads(walletAddress, limit, offset);
  const total = getUserUploadCount(walletAddress);
  
  res.json({
    uploads: uploads.map(u => ({
      id: u.arweave_id,
      url: u.url,
      type: u.type,
      encrypted: !!u.encrypted,
      size_bytes: u.size_bytes,
      cost_usd: u.cost_usd,
      created_at: u.created_at,
    })),
    total,
    limit,
    offset,
  });
});

app.get('/api/uploads/export', (req, res) => {
  const walletAddress = authenticate(req);
  if (!walletAddress) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Missing or invalid authorization header' });
  }
  
  const format = req.query.format as string || 'json';
  
  if (format === 'csv') {
    const csv = exportUploadsCsv(walletAddress);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=chronicle-uploads.csv');
    return res.send(csv);
  }
  
  const json = exportUploadsJson(walletAddress);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=chronicle-uploads.json');
  res.send(json);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`CHRONICLE API running on port ${PORT}`);
  console.log(`Network: ${NETWORK} (${networkChainId})`);
  console.log(`Payment receiver: ${EVM_ADDRESS}`);
});

export default app;
