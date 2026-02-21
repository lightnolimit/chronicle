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
PORT=3001               # API server port (optional)
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
