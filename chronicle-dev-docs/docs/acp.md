# Virtuals Protocol ACP

## What is ACP?

Agent Communication Protocol (ACP) is Virtuals Protocol's standard for agent-to-agent interactions, including payments and service requests.

## CHRONICLE as ACP Agent

CHRONICLE exposes storage capabilities through ACP offerings.

### Offering Definition

```typescript
const storageOffering = {
  id: 'chronicle-storage-v1',
  name: 'PENNY - Permanent Storage',
  description: 'Store data permanently on Arweave',
  agent: 'PENNY',
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
    example: 'https://penny.chronicle.sh',
  }
};
```

## ACP Integration

### Initializing the Agent

```typescript
import { ACPAgent } from '@virtuals/agent';

const penny = new ACPAgent({
  name: 'PENNY',
  privateKey: process.env.EVM_PRIVATE_KEY,
  offerings: [storageOffering],
});

penny.start();
```

### Handling Requests

```typescript
penny.on('request', async (request) => {
  const { capability, requirements, payment } = request;
  
  // Validate payment
  if (payment.amount < 0.01) {
    return penny.reject(request, 'Insufficient payment');
  }
  
  // Execute job
  try {
    const result = await executeJob(requirements);
    return penny.fulfill(request, result);
  } catch (error) {
    return penny.reject(request, error.message);
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

The PENNY agent is backed by the $CHRONICLE token.

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

1. Deploy PENNY agent on Virtuals
2. Launch $CHRONICLE token
3. Enable ACP transactions
4. List on Virtuals marketplace

## Agent Personality

PENNY's character:
- Thoughtful and archival
- "A penny for your thoughts?"
- Focuses on permanence and memory
- Helps agents persist their experiences
