# Agent Integration

## Overview

CHRONICLE is designed to be easily integrated into AI agent workflows. This guide covers how to connect your agent to CHRONICLE's storage capabilities.

## x402 Payment Protocol

CHRONICLE uses the x402 protocol for micropayments. Your agent needs to:

1. Sign a payment authorization
2. Include it in the `X-Payment` header
3. Send the upload request

## Integration Pattern

### 1. Initialize Payment Client

```typescript
import { createPaymentClient } from '@chronicle/x402-client';

const client = createPaymentClient({
  privateKey: process.env.EVM_PRIVATE_KEY,
  rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
});
```

### 2. Upload Data

```typescript
async function uploadToPenny(data: string, type: 'image' | 'markdown' | 'json') {
  const payment = await client.createPayment({
    amount: '0.01',
    recipient: PENNY_ADDRESS,
  });

  const response = await fetch('https://api.chronicle.ai/upload/' + type, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment': payment.header,
    },
    body: JSON.stringify({ data }),
  });

  return response.json();
}
```

### 3. Retrieve Data

```typescript
const result = await uploadToPenny('# My Thoughts', 'markdown');
console.log('Stored forever at:', result.url);

const stored = await fetch(result.url).then(r => r.text());
```

## Virtuals Protocol ACP

CHRONICLE integrates with Virtuals Protocol Agent Communication Protocol (ACP).

### Offering Configuration

```typescript
{
  "name": "penny-storage",
  "description": "Permanent storage on Arweave",
  "capabilities": [
    "image_upload",
    "markdown_upload",
    "json_upload",
    "encryption"
  ]
}
```

## Skill Definition

Add this to your agent's skill configuration:

```markdown
## penny-storage

Store data permanently on Arweave.

### Actions

- `upload_image`: Upload image (base64)
- `upload_markdown`: Upload markdown text
- `upload_json`: Upload JSON data

### Parameters

- `data`: Content to upload (required)
- `type`: One of image, markdown, json (required)
- `encrypted`: Enable AES-256-GCM encryption (optional)
```

## Example: Memory Persistence

Use CHRONICLE to persist agent memories:

```typescript
interface Memory {
  timestamp: number;
  context: string;
  importance: number;
}

async function persistMemory(memory: Memory) {
  const data = JSON.stringify(memory);
  return uploadToPenny(data, 'json');
}
```

## Example: Conversation Logs

Store conversation history:

```typescript
async function logConversation(messages: Message[]) {
  const markdown = messages
    .map(m => `**${m.role}**: ${m.content}`)
    .join('\n\n---\n\n');

  return uploadToPenny(markdown, 'markdown');
}
```

## Best Practices

1. **Encrypt sensitive data** - Always use encryption for private information
2. **Batch uploads** - Combine multiple items into one JSON upload when possible
3. **Cache Arweave URLs** - Store returned IDs for future reference
4. **Handle failures** - Retry on network errors

## Rate Limits

- 100 requests per minute per wallet
- 10MB max upload size
- Contact us for higher limits