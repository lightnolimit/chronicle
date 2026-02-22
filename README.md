# CHRONICLE

Permanent storage for AI agents. Upload documents to Arweave via Turbo with x402 micropayments (USDC on Base).

## Features

- **Permanent Storage** - Documents stored on Arweave via Turbo
- **Micropayments** - Pay per upload with USDC on Base ($0.01 minimum)
- **MacOS-Classic UI** - Retro desktop-style interface
- **Wallet Connect** - RainbowKit integration for easy wallet connection
- **x402 Protocol** - HTTP-native payment flow via PayAI facilitator

## Quick Start

### Prerequisites

- Node.js 18+
- npm 10+
- A Base wallet with USDC

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/chronicle.git
cd chronicle

# Install dependencies
npm run install:all

# Configure environment
cp agent/.env.example agent/.env
# Edit agent/.env with your wallet details
```

### Environment Variables

```bash
# agent/.env
EVM_PRIVATE_KEY=0x...     # Your Base wallet private key
EVM_ADDRESS=0x...         # Address to receive USDC payments
NETWORK=base              # base (mainnet) or base-sepolia (testnet)
```

### Run

```bash
# Start both frontend and API
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Architecture

```
chronicle/
├── agent/           # Express API with x402 middleware
│   ├── src/
│   │   ├── server.ts        # API endpoints
│   │   └── services/
│   │       ├── upload.ts    # Turbo/Arweave uploads
│   │       └── database.ts  # SQLite storage
│   └── .env                 # Wallet configuration
├── frontend/        # React + Vite + Wagmi
│   └── src/
│       ├── App.tsx          # MacOS-style UI
│       └── wagmi.ts         # Wallet config
├── docs/            # Public documentation
└── dev-docs/        # Internal documentation
```

## Payment Flow

1. User connects wallet (RainbowKit)
2. User writes document and clicks "Submit to Permaweb"
3. Server returns 402 with payment requirements
4. User signs EIP-712 typed data (EIP-3009 TransferWithAuthorization)
5. PayAI facilitator verifies and settles payment
6. Document uploaded to Arweave via Turbo
7. User receives permanent URL

## Pricing

- **Minimum**: $0.01 USD
- **Markup**: 10% over Turbo costs
- **Token**: USDC on Base

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Wagmi, RainbowKit |
| Backend | Express, TypeScript |
| Storage | Arweave (via Turbo) |
| Payments | x402, PayAI facilitator |
| Database | SQLite (better-sqlite3) |
| Network | Base (Ethereum L2) |

## Documentation

- [x402 Integration Guide](dev-docs/docs/x402.md) - Complete payment implementation
- [Architecture](dev-docs/docs/architecture.md) - System design
- [Pricing](dev-docs/docs/pricing.md) - Pricing model details

## License

ISC
