# CHRONICLE - Agent Development Guide

## Project Structure

```
chronicle/
├── chronicle-agent/     # Backend agent with x402 payments + SQLite
├── chronicle-frontend/ # Landing page UI with wallet connect
└── chronicle-docs/    # Documentation site
```

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
cd chronicle-frontend && npm install

# Agent
cd chronicle-agent && npm install

# Docs
cd chronicle-docs && npm install
```

### 2. Environment Setup

```bash
# Agent - copy .env.example to .env
cp chronicle-agent/.env.example chronicle-agent/.env
# Edit and add your EVM_PRIVATE_KEY (Base chain)
```

### 3. Run Development

```bash
# Terminal 1 - Frontend
cd chronicle-frontend && npm run dev

# Terminal 2 - API Server (optional)
cd chronicle-agent && npm run dev:api
```

## Environment Variables

### chronicle-agent/.env
```
EVM_PRIVATE_KEY=0x...     # Your Base wallet private key
EVM_ADDRESS=0x...         # Address to receive payments
NETWORK=base              # base (mainnet) or base-sepolia (testnet)
PORT=3001                 # API server port (optional)
```

### chronicle-frontend/.env
```
VITE_API_URL=http://localhost:3001  # API URL (optional)
```

## Commands

### Frontend
```bash
npm run dev    # Start dev server
npm run build  # Production build
```

### Agent
```bash
npm run dev        # Start agent
npm run dev:api    # Start API server
npm run build      # Build TypeScript
```

### Docs
```bash
npm run dev    # Start docs server
npm run build  # Production build
```

## Tech Stack

- **Frontend**: React + Vite + Wagmi + Framer Motion
- **Agent**: TypeScript + Turbo SDK + better-sqlite3
- **Docs**: React + React Markdown
- **Storage**: Arweave via Turbo
- **Payments**: x402 (USDC on Base)

---

# x402 Payment Integration Guide

## Overview

x402 is an HTTP-native payment protocol that uses the 402 status code. Chronicle uses **PayAI** as the facilitator for payment verification and settlement.

### Key Components

1. **Resource Server**: Your API that requires payment (chronicle-agent)
2. **Client**: The app making requests (chronicle-frontend)
3. **Facilitator**: PayAI service that verifies and settles payments

### Payment Flow

```
1. Client requests resource
2. Server returns 402 + PAYMENT-REQUIRED header (base64 JSON)
3. Client signs EIP-712 typed data (EIP-3009 TransferWithAuthorization)
4. Client sends PAYMENT-SIGNATURE header with signed authorization
5. Facilitator verifies and settles payment on-chain
6. Server returns resource + PAYMENT-RESPONSE header
```

---

## Server Setup (Express + PayAI)

### 1. Install Dependencies

```bash
npm install @x402/express @x402/evm @payai/facilitator
```

### 2. Configure Server

```typescript
import express from 'express';
import cors from 'cors';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator } from '@payai/facilitator';
import { HTTPFacilitatorClient } from '@x402/core/server';

const app = express();

// CRITICAL: Expose payment headers for browser clients
app.use(cors({
  exposedHeaders: ['payment-required', 'payment-response', 'PAYMENT-SIGNATURE'],
}));

// Configure network (CAIP-2 format)
const network = 'eip155:8453';  // Base mainnet
// const network = 'eip155:84532';  // Base Sepolia

// Setup PayAI facilitator
const facilitatorClient = new HTTPFacilitatorClient(facilitator);
const x402Server = new x402ResourceServer(facilitatorClient);
x402Server.register(network, new ExactEvmScheme());

// Configure payment middleware
app.use(
  paymentMiddleware(
    {
      'POST /api/upload': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',  // Minimum price
            network: network,
            payTo: process.env.EVM_ADDRESS,  // Your payment address
          },
        ],
        description: 'Upload document to Arweave via Turbo',
        mimeType: 'application/json',
      },
    },
    x402Server,
  ),
);
```

### Server Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Browser can't see `payment-required` header | CORS not exposing headers | Add `exposedHeaders` to cors config |
| Wrong facilitator URL | Using `x402.org/facilitator` | Use `@payai/facilitator` package |
| Wrong network format | Using `base` or `base-sepolia` | Use CAIP-2: `eip155:8453` or `eip155:84532` |

---

## Client Setup (React + Wagmi)

### 1. Install Dependencies

```bash
npm install wagmi @rainbow-me/rainbowkit
```

### 2. USDC Contract Addresses

```typescript
const USDC_CONTRACTS: Record<number, `0x${string}`> = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base mainnet
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
};
```

### 3. EIP-712 Typed Data Structure

**CRITICAL**: x402 uses EIP-3009 `TransferWithAuthorization`, which requires EIP-712 typed data signing, NOT plain message signing.

```typescript
const EIP3009_DOMAIN = {
  name: 'USD Coin',
  version: '2',
};

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};
```

### 4. Signing with Wagmi

```typescript
import { useSignTypedData } from 'wagmi';

function MyComponent() {
  const { signTypedDataAsync } = useSignTypedData();
  
  const handlePayment = async () => {
    // Get payment requirements from 402 response
    const decoded = JSON.parse(atob(paymentRequiredHeader));
    const accepted = decoded.accepts[0];
    
    // Build authorization
    const now = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();  // 32-byte hex
    
    const domain = {
      ...EIP3009_DOMAIN,
      chainId: 8453,
      verifyingContract: USDC_CONTRACTS[8453],
    };
    
    const message = {
      from: userAddress,
      to: accepted.payTo,
      value: accepted.amount,
      validAfter: now.toString(),
      validBefore: (now + 300).toString(),  // 5 min window
      nonce,
    };
    
    // Sign EIP-712 typed data
    const signature = await signTypedDataAsync({
      domain,
      types: EIP3009_TYPES,
      primaryType: 'TransferWithAuthorization',
      message,
    });
    
    // Build PAYMENT-SIGNATURE header
    const paymentHeader = buildPaymentHeader(signature, message, accepted, decoded.accepts[0].network);
  };
}

function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}
```

### 5. PAYMENT-SIGNATURE Header Format

**CRITICAL**: The header must be base64-encoded JSON with ALL required fields:

```typescript
function buildPaymentHeader(
  signature: `0x${string}`,
  authorization: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: `0x${string}`;
  },
  accepted: any,  // The payment requirement object from server
  network: string  // CAIP-2 network ID
): string {
  const payload = {
    x402Version: 2,
    scheme: 'exact',
    network,        // REQUIRED: e.g., "eip155:8453"
    accepted,       // REQUIRED: the payment requirement we accepted
    payload: {
      signature,
      authorization,
    },
    extensions: {},
  };
  return btoa(JSON.stringify(payload));
}
```

---

## Common Pitfalls

### 1. Using `signMessage` instead of `signTypedData`

**Wrong:**
```typescript
const signature = await walletClient.signMessage({
  message: `Authorize payment of ${amount} USDC`,
});
```

**Correct:**
```typescript
const signature = await signTypedDataAsync({
  domain,
  types: EIP3009_TYPES,
  primaryType: 'TransferWithAuthorization',
  message,
});
```

**Why**: EIP-3009 requires EIP-712 typed data signing. Plain message signing won't work.

### 2. Missing Fields in PAYMENT-SIGNATURE

**Wrong:**
```json
{
  "x402Version": 2,
  "scheme": "exact",
  "payload": { ... }
}
```

**Correct:**
```json
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "eip155:8453",
  "accepted": { ... },
  "payload": { ... },
  "extensions": {}
}
```

### 3. Wrong Nonce Format

**Wrong:**
```typescript
const nonce = Math.random().toString(36);  // String nonce
```

**Correct:**
```typescript
const nonce = generateNonce();  // 32-byte hex: "0x..."
```

### 4. Missing Time Window

**Wrong:**
```typescript
// No validAfter/validBefore
```

**Correct:**
```typescript
const now = Math.floor(Date.now() / 1000);
validAfter: now.toString(),
validBefore: (now + 300).toString(),  // 5 minute window
```

### 5. CORS Not Exposing Headers

**Wrong:**
```typescript
app.use(cors());
```

**Correct:**
```typescript
app.use(cors({
  exposedHeaders: ['payment-required', 'payment-response', 'PAYMENT-SIGNATURE'],
}));
```

**Why**: Browsers can only read certain headers by default. Custom headers must be explicitly exposed.

### 6. Wrong Facilitator

**Wrong:**
```typescript
const facilitatorUrl = 'https://x402.org/facilitator';
```

**Correct:**
```typescript
import { facilitator } from '@payai/facilitator';
const facilitatorClient = new HTTPFacilitatorClient(facilitator);
```

**Why**: The x402.org facilitator has different behavior. Use PayAI for reliable payments.

---

## Debugging

### Check Payment Requirements

```bash
curl -i -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d '{"data":"test","type":"text","name":"test.txt"}' \
  | grep PAYMENT-REQUIRED
```

Decode the base64:
```bash
echo "eyJ4NDAy..." | base64 -d | python3 -m json.tool
```

### Expected Payment Requirements

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "http://localhost:3001/api/upload",
    "description": "Upload document to Arweave via Turbo",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "amount": "10000",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0x...",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "USD Coin",
        "version": "2"
      }
    }
  ]
}
```

### Amount Interpretation

- USDC has 6 decimals
- `amount: "10000"` = 0.01 USDC
- `amount: "1000000"` = 1.0 USDC

### Facilitator Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `insufficient_funds` | User lacks USDC balance | User needs to buy USDC |
| `invalid_exact_evm_payload_signature` | Signature invalid | Check EIP-712 signing |
| `invalid_exact_evm_payload_authorization_value` | Amount mismatch | Use exact `amount` from server |
| `invalid_network` | Wrong network | Check CAIP-2 format |

---

## Supported Networks

| Network | CAIP-2 ID | Chain ID |
|---------|-----------|----------|
| Base Mainnet | `eip155:8453` | 8453 |
| Base Sepolia | `eip155:84532` | 84532 |
| Polygon | `eip155:137` | 137 |
| Avalanche | `eip155:43114` | 43114 |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | - |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | - |

---

## References

- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [PayAI Documentation](https://docs.payai.network/x402/introduction)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [EIP-712: Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [PayAI Facilitator](https://facilitator.payai.network)
