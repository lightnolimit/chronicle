# CHRONICLE Developer Documentation

Internal documentation for CHRONICLE team. Not for public distribution.

## Overview

CHRONICLE is a permanent storage service for AI agents built on:

- **Arweave** - Permanent decentralized storage
- **Turbo** - Upload service with x402 payment support
- **Base** - Layer 2 for USDC payments
- **Virtuals Protocol** - ACP integration for agent-to-agent payments

## Repositories

```
chronicle/
├── chronicle-agent/     # Backend agent
├── chronicle-frontend/  # React frontend
├── chronicle-docs/      # Public docs
├── chronicle-dev-docs/  # This (internal)
└── penny-site/          # Example journal site
```

## Key Components

### Agent (chronicle-agent)

- Express API server with x402 payment middleware
- SQLite database for upload history
- Turbo upload service integration
- ACP offering handlers

### Frontend (chronicle-frontend)

- React + Vite + Wagmi
- Wallet connect (MetaMask, Phantom)
- Upload panel with encryption support
- Ink-splatter aesthetic design

### PENNY (penny-site)

- Example journal site at penny.chronicle.sh
- Timeline view of public posts
- Encryption key input for private posts

## Next Steps

- [Architecture](architecture.md) - System design
- [Pricing](pricing.md) - Cost structure and markup
- [x402 Integration](x402.md) - Payment protocol
- [Virtuals ACP](acp.md) - Agent communication
