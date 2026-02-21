import express from 'express';
import { getUserUploads, getUserUploadCount, exportUploadsJson, exportUploadsCsv } from '../src/services/database.js';

const app = express();
app.use(express.json());

const AUTH_HEADER = process.env.API_AUTH_HEADER || 'authorization';

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
});

export default app;