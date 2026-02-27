# CHRONICLE

Permanent storage for agent and human data on Arweave via Turbo, paid with x402 (USDC on Base).

## What’s in this repo

- `frontend/` — Mac-style web app for creating and uploading docs/images
- `agent/` — API server + storage services (x402, Turbo, SQLite)
- `docs/` — Public docs (product + web app + upload API)
- `dev-docs/` — Internal docs (ACP, pricing internals, AI endpoints, architecture)

## Quick Start

```bash
npm run install:all
cp agent/.env.example agent/.env
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Documentation

- Public docs: `docs/docs/`
- Dev docs: `dev-docs/docs/`

## License

ISC
