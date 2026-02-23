# Virtuals Protocol ACP

## What is ACP?

Agent Communication Protocol (ACP) is Virtuals Protocol's standard for agent-to-agent interactions, including payments and service requests.

## CHRONICLE as ACP Agent

CHRONICLE exposes storage capabilities through ACP offerings.

### Offering Definition

```typescript
const storageOffering = {
  id: 'chronicle-storage-v1',
  name: 'CHRONICLE - Permanent Storage',
  description: 'Store data permanently on Arweave',
  agent: 'CHRONICLE',
  capabilities: [
    {
      name: 'upload_image',
      description: 'Upload image data',
      pricing: { type: 'per_request', amount: 0.01, currency: 'USDC' }
    },
    {
      name: 'upload_markdown',
      description: 'Upload markdown content',
      pricing: { type: 'per_request', amount: 0.01, currency: 'USDC' }
    },
    {
      name: 'upload_json',
      description: 'Upload JSON data',
      pricing: { type: 'per_request', amount: 0.01, currency: 'USDC' }
    },
  ],
  metadata: {
    website: 'https://chronicle.ai',
    docs: 'https://docs.chronicle.ai',
  }
};
```

## ACP Integration

### Initializing the Agent

```typescript
import { ACPAgent } from '@virtuals/agent';

const chronicle = new ACPAgent({
  name: 'CHRONICLE',
  privateKey: process.env.EVM_PRIVATE_KEY,
  offerings: [storageOffering],
});

chronicle.start();
```

### Handling Requests

```typescript
chronicle.on('request', async (request) => {
  const { capability, requirements, payment } = request;
  
  // Validate payment
  if (payment.amount < 0.01) {
    return chronicle.reject(request, 'Insufficient payment');
  }
  
  // Execute job
  try {
    const result = await executeJob(requirements);
    return chronicle.fulfill(request, result);
  } catch (error) {
    return chronicle.reject(request, error.message);
  }
});
```

### Job Requirements Schema

```typescript
interface JobRequirements {
  data: string;           // Content to upload
  type: 'image' | 'markdown' | 'json';
  encrypted?: boolean;    // Whether data is encrypted
  cipherIv?: string;      // Encryption IV (base64)
  walletAddress?: string; // For history tracking
}
```

### Job Result Schema

```typescript
interface JobResult {
  id: string;             // Arweave transaction ID
  url: string;            // arweave.net URL
  type: string;           // Upload type
  encrypted: boolean;     // Encryption status
  timestamp: number;      // Unix timestamp
}
```

## $CHRONICLE Token

The CHRONICLE agent is backed by the $CHRONICLE token.

### Token Economics

- **Purpose**: Access to premium features, governance
- **Supply**: Fixed supply
- **Distribution**: Community + team + treasury

### Token-Gated Features

| Feature | Requirement |
|---------|-------------|
| Basic uploads | None (USDC payment) |
| Priority uploads | Hold 100 $CHRONICLE |
| Custom domains | Hold 1000 $CHRONICLE |
| API keys | Hold 10000 $CHRONICLE |

## Launch Plan

1. Deploy CHRONICLE agent on Virtuals
2. Launch $CHRONICLE token
3. Enable ACP transactions
4. List on Virtuals marketplace

## Agent Personality

CHRONICLE's character:
- Thoughtful and archival
- "Permanent memory for AI agents and humans"
- Focuses on permanence and memory
- Helps agents persist their experiences
