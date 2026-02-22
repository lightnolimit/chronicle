# CHRONICLE - Agent Development Guide

## Project Structure

```
chronicle/
├── chronicle-agent/     # Backend agent with x402 payments + SQLite
├── chronicle-frontend/  # Landing page UI with wallet connect
├── chronicle-docs/      # Public documentation site
└── chronicle-dev-docs/  # Internal development documentation
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
# Edit and add your EVM_PRIVATE_KEY and EVM_ADDRESS
```

### 3. Run Development

```bash
# Terminal 1 - Frontend
cd chronicle-frontend && npm run dev

# Terminal 2 - API Server
cd chronicle-agent && npm run dev:api
```

## Environment Variables

### chronicle-agent/.env
```
EVM_PRIVATE_KEY=0x...     # Your Base wallet private key (for Turbo uploads)
EVM_ADDRESS=0x...         # Address to receive USDC payments
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
- **Docs**: MkDocs (Markdown)
- **Storage**: Arweave via Turbo
- **Payments**: x402 (USDC on Base) via PayAI facilitator

---

## Key Files

| File | Purpose |
|------|---------|
| `chronicle-agent/src/server.ts` | Express API with x402 middleware |
| `chronicle-agent/src/services/upload.ts` | Turbo upload service |
| `chronicle-agent/src/services/database.ts` | SQLite operations |
| `chronicle-frontend/src/App.tsx` | Main React app with x402 client |
| `chronicle-frontend/src/wagmi.ts` | Wagmi config for Base |

---

## Documentation

- **[chronicle-dev-docs/docs/x402.md](chronicle-dev-docs/docs/x402.md)** - Complete x402/PayAI integration guide
- **[chronicle-dev-docs/docs/pricing.md](chronicle-dev-docs/docs/pricing.md)** - Pricing model details
- **[chronicle-dev-docs/docs/architecture.md](chronicle-dev-docs/docs/architecture.md)** - System architecture

---

## x402 Quick Reference

For detailed x402 integration, see [chronicle-dev-docs/docs/x402.md](chronicle-dev-docs/docs/x402.md).

### Key Points

1. **Use PayAI facilitator** - `import { facilitator } from '@payai/facilitator'`
2. **EIP-712 signing** - Use `signTypedData`, NOT `signMessage`
3. **Expose CORS headers** - `payment-required`, `payment-response`, `PAYMENT-SIGNATURE`
4. **CAIP-2 network format** - `eip155:8453` for Base mainnet

### Common Errors

| Error | Fix |
|-------|-----|
| Browser can't read payment headers | Add `exposedHeaders` to CORS |
| "Payment failed" after signing | Use `signTypedData` for EIP-712 |
| Wrong amount displayed | USDC has 6 decimals (10000 = 0.01 USDC) |

---

## References

- [PayAI Documentation](https://docs.payai.network/x402/introduction)
- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [PayAI Facilitator](https://facilitator.payai.network)
