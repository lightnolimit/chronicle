# CHRONICLE - x402 Storage Agent

> Persistent storage service for AI agents on Virtuals Protocol ACP

CHRONICLE provides permanent, cheap storage for AI agents via the x402 payment protocol and Arweave/Turbo. Perfect for long-term memory, journals, and reference data that doesn't need instant access.

## Features

- **x402 Payments** - Automatic micropayments via USDC on Base
- **Arweave Storage** - Permanent, immutable data storage
- **Closed-Loop Economics** - Pass-through payments, no startup capital needed
- **Encryption Support** - Client-side AES-256-GCM encryption
- **10% Markup** - Profit on every upload over Turbo costs

## Installation

```bash
git clone https://github.com/your-org/chronicle-agent
cd chronicle-agent
npm install
```

## Setup

1. Copy `.env.example` to `.env`
2. Set `EVM_PRIVATE_KEY` with your Base wallet private key
3. Run `npm run build`

## ACP Integration

CHRONICLE is designed to run as an ACP agent offering. See [references/seller.md](./references/seller.md) for full setup instructions.

### Quick Start with ACP

```bash
# Install ACP CLI
git clone https://github.com/Virtual-Protocol/openclaw-acp
cd openclaw-acp && npm install && npm link

# Setup your agent
acp setup

# Create offering
acp sell init chronicle-storage
# (copy offering.json from offerings/storage/)

# Start seller runtime
acp serve start
```

## Usage

### Upload Image

```typescript
const result = await executeJob({
  data: base64ImageData,
  type: 'image',
});
```

### Upload Markdown

```typescript
const result = await executeJob({
  data: '# My Journal\n\nEntry for today...',
  type: 'markdown',
});
```

### Upload JSON

```typescript
const result = await executeJob({
  data: JSON.stringify({ key: 'value' }),
  type: 'json',
});
```

### Encrypted Upload

```typescript
const result = await executeJob({
  data: encryptedBase64Data,
  type: 'json',
  encrypted: true,
  cipherIv: 'base64-encoded-iv',
});
```

## Pricing

- **Base Price**: $0.01 per request
- **Scaling**: $0.01 + (size_kb × $0.001) × 1.10
- **Markup**: 10% over Turbo costs
- **Payment**: USDC via x402 on Base

## Encryption

Data is encrypted client-side before upload. Use AES-256-GCM:

```typescript
// Encrypt
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Store with tags: Encrypted=true, Cipher=AES-256-GCM, Cipher-IV=<base64>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EVM_PRIVATE_KEY` | Base wallet private key for x402 payments |

## Files

```
chronicle-agent/
├── src/
│   ├── index.ts              # Entry point
│   ├── services/
│   │   ├── upload.ts         # Turbo upload service
│   │   ├── pricing.ts        # Pricing calculator
│   │   └── encryption.ts     # AES-256-GCM helpers
│   ├── handlers/
│   │   ├── upload_image.ts
│   │   ├── upload_markdown.ts
│   │   └── upload_json.ts
│   └── types/
│       └── index.ts
├── offerings/
│   └── storage/
│       ├── offering.json     # ACP offering definition
│       └── handlers.ts       # Job handlers
└── README.md
```

## Use Cases

- **Journaling** - AI agents writing daily logs
- **Long-term Memory** - Reference data for future context
- **Audit Trails** - Immutable records of decisions
- **Encrypted Secrets** - Secure storage for sensitive data

## License

MIT