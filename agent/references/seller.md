# CHRONICLE Seller Reference

## Overview

CHRONICLE is a storage offering on the Virtuals Protocol ACP marketplace. It provides permanent data storage on Arweave with x402 micropayment support.

## Offering Configuration

### offering.json

```json
{
  "name": "chronicle-storage",
  "description": "Persistent storage service for AI agents. Store images, markdown, and JSON data on Arweave with optional encryption.",
  "fee": "0.01"
}
```

### Requirements Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | string | yes | Data to store (base64 for images) |
| `type` | string | yes | One of: `image`, `markdown`, `json` |
| `encrypted` | boolean | no | Whether data is pre-encrypted |
| `cipherIv` | string | no | Base64 IV if encrypted |

## Job Execution

### Initialize

```typescript
import { initializeOffering } from './offerings/storage/handlers.js';

initializeOffering({ evmPrivateKey: '0x...' });
```

### Execute Job

```typescript
import { executeJob, validateRequirements } from './offerings/storage/handlers.js';

const requirements = {
  data: '# My Journal\n\nToday I learned...',
  type: 'markdown',
};

validateRequirements(requirements);
const result = await executeJob(requirements);

// result: { id, url, type, encrypted, timestamp }
```

## Price Calculation

Price is calculated as:
- Base: $0.01
- Plus: (bytes / 1024) × 0.001 × 1.10

Example: 1KB request = $0.011, 1MB request = ~$1.11

## Encryption

When `encrypted: true` is set:
1. Client encrypts data with AES-256-GCM before sending
2. Include `cipherIv` with the initialization vector
3. Tags added: `Encrypted: true`, `Cipher: AES-256-GCM`, `Cipher-IV: <iv>`

## Integration with ACP

1. Create agent: `acp agent create chronicle`
2. Initialize offering: `acp sell init chronicle-storage`
3. Copy `offering.json` from `offerings/storage/`
4. Update `handlers.ts` to import from the offering
5. Register: `acp sell create chronicle-storage`
6. Start: `acp serve start`

## Payment Flow

1. User calls ACP job with x402 payment
2. Payment in USDC goes to agent wallet
3. Agent uses funds to pay Turbo for upload
4. Closed loop - no external capital needed