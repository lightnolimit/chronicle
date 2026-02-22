# CHRONICLE - Agent Development Guide

## Project Structure

```
chronicle/
├── agent/           # Backend agent with x402 payments + SQLite
├── frontend/        # Landing page UI with wallet connect
├── docs/            # Public documentation site
└── dev-docs/        # Internal development documentation
```

## Quick Start

### 1. Install Dependencies

```bash
# All workspaces
npm run install:all

# Or individually
cd frontend && npm install
cd agent && npm install
```

### 2. Environment Setup

```bash
# Agent - copy .env.example to .env
cp agent/.env.example agent/.env
# Edit and add your EVM_PRIVATE_KEY and EVM_ADDRESS
```

### 3. Run Development

```bash
# Both frontend and API
npm run dev

# Or separately
npm run dev:frontend   # Terminal 1
npm run dev:api        # Terminal 2
```

## Environment Variables

### agent/.env
```
EVM_PRIVATE_KEY=0x...     # Your Base wallet private key (for Turbo uploads)
EVM_ADDRESS=0x...         # Address to receive USDC payments
NETWORK=base              # base (mainnet) or base-sepolia (testnet)
PORT=3001                 # API server port (optional)
```

### frontend/.env
```
VITE_API_URL=http://localhost:3001  # API URL (optional)
```

## Commands

### Root Level
```bash
npm run dev           # Start frontend + API
npm run dev:frontend  # Start frontend only
npm run dev:api       # Start API only
npm run dev:docs      # Start docs server
npm run build         # Build all workspaces
```

### Frontend
```bash
cd frontend
npm run dev    # Start dev server
npm run build  # Production build
```

### Agent
```bash
cd agent
npm run dev        # Start agent
npm run dev:api    # Start API server
npm run build      # Build TypeScript
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
| `agent/src/server.ts` | Express API with x402 middleware |
| `agent/src/services/upload.ts` | Turbo upload service |
| `agent/src/services/database.ts` | SQLite operations |
| `frontend/src/App.tsx` | Main React app with x402 client |
| `frontend/src/wagmi.ts` | Wagmi config for Base |

---

## Documentation

- **[dev-docs/docs/x402.md](dev-docs/docs/x402.md)** - Complete x402/PayAI integration guide
- **[dev-docs/docs/pricing.md](dev-docs/docs/pricing.md)** - Pricing model details
- **[dev-docs/docs/architecture.md](dev-docs/docs/architecture.md)** - System architecture

---

## x402 Quick Reference

For detailed x402 integration, see [dev-docs/docs/x402.md](dev-docs/docs/x402.md).

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
