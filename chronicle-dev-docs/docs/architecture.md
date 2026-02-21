# Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│   CHRONICLE     │────▶│     Turbo       │
│   (Client)      │     │   Agent         │     │   (Arweave)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   x402 Payment  │     │    SQLite       │     │    Arweave      │
│   (USDC/Base)   │     │   (History)     │     │   (Permanent)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Components

### 1. API Server (Express)

Located in `chronicle-agent/src/server.ts`

```typescript
// Endpoints
POST /upload/image    // Upload image
POST /upload/markdown // Upload markdown
POST /upload/json     // Upload JSON
GET  /uploads/:wallet // Get user uploads
GET  /uploads/export  // Export history
```

### 2. Upload Service

Located in `chronicle-agent/src/services/upload.ts`

- Handles Turbo upload API calls
- Tags data with content type and metadata
- Supports optional encryption

### 3. Database Service

Located in `chronicle-agent/src/services/database.ts`

- SQLite for local development
- Tracks upload history per wallet
- Supports JSON/CSV export

### 4. Encryption Service

Located in `chronicle-agent/src/services/encryption.ts`

- AES-256-GCM encryption
- Client-side encryption recommended
- IV stored in Arweave tags

## Data Flow

1. Client connects wallet (wagmi)
2. Client prepares data (optionally encrypts)
3. Client initiates upload request
4. x402 payment middleware validates payment
5. Agent uploads to Turbo
6. Agent records to SQLite
7. Agent returns Arweave transaction ID

## Security Considerations

- Never log private keys
- Validate all input data
- Rate limit by wallet address
- Use environment variables for secrets
