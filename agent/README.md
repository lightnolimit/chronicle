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
ACP_ENABLED=true          # optional, enables ACP seller runtime
ACP_WHITELISTED_WALLET_PRIVATE_KEY=0x...  # recommended ACP memo signer
ACP_SESSION_KEY_ID=12345
ACP_AGENT_WALLET=0x...
```

## ACP

Chronicle now supports two ACP execution modes:

- `npm run dev:api` / `npm run start:api` for the human/x402 API
- `npm run dev:acp` / `npm run start:acp` for the ACP seller runtime
- `npm run dev` to run both locally from one Node process

Primary ACP implementation files:

- `agent/src/services/acp.ts`
- `agent/src/acp/catalog.ts`
- `dev-docs/docs/acp.md`

## Docs

- Public docs: `docs/docs/`
- Dev docs: `dev-docs/docs/`
