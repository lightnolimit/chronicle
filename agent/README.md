# CHRONICLE Agent

Express API + storage services for Chronicle. Handles x402 payments, uploads to Arweave via Turbo, and records upload history in SQLite.

## Quick Start

```bash
cd agent
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```
EVM_PRIVATE_KEY=0x...     # Base wallet private key
EVM_ADDRESS=0x...         # Address to receive USDC payments
NETWORK=base              # base (mainnet) or base-sepolia (testnet)
PORT=3001                 # optional
CHUTES_API_KEY=...        # required for AI endpoints on mainnet
```

## ACP

ACP support is in `agent/offerings/storage/`. See:

- `agent/offerings/storage/`
- `agent/references/seller.md`
- `dev-docs/docs/acp.md`

## Docs

- Public docs: `docs/docs/`
- Dev docs: `dev-docs/docs/`
