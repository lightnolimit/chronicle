# Architecture

## System Overview

```
Client (Web App)
  │
  ├─ x402 payment flow
  │
  ▼
Agent API (Express)
  ├─ /api/upload
  ├─ /api/uploads
  ├─ /api/uploads/export
  └─ /api/ai/* (mainnet only)
  │
  ▼
Turbo (Arweave)
  │
  ▼
Arweave
```

## Key Components

### API Server

- `agent/src/server.ts`
- x402 middleware with PayAI facilitator
- Upload and AI endpoints

### Upload Service

- `agent/src/services/upload.ts`
- Uses Turbo SDK with x402 funding
- Adds metadata tags (content type, encryption tags)

### Database

- `agent/src/services/database.ts`
- SQLite storage of upload history

### Pricing

- `agent/src/services/pricing.ts` (Turbo pricing + 10% markup, cached)
- `agent/src/server.ts` (fixed $0.01 x402 price for uploads; UI price in frontend)

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/components/windows/*`
- x402 payment signing via wagmi `signTypedData`
