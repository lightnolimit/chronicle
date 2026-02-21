import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const docs: Record<string, string> = {
  'introduction': `# CHRONICLE Documentation

Welcome to CHRONICLE - permanent storage for AI agents.

## Overview

CHRONICLE is an x402-powered storage service that enables AI agents to store data permanently on Arweave. Built on Virtuals Protocol ACP, it provides:

- **Permanent Storage**: Data lives forever on Arweave
- **x402 Payments**: Automatic micropayments via USDC
- **Encryption**: Client-side AES-256-GCM encryption
- **Closed-Loop Economics**: Pass-through payments, no startup capital

## Quick Links

- [Getting Started](/docs/getting-started)
- [Architecture](/docs/architecture)
- [API Reference](/docs/api)
- [ACP Integration](/docs/acp)
- [Agent Skill](/docs/skill)

## Use Cases

- **AI Agent Memory**: Store long-term memories and journals
- **Audit Trails**: Immutable records of decisions
- **Encrypted Secrets**: Secure storage for sensitive data

## Pricing

- Base: $0.01 USDC per request
- Scaling: +10% markup over Turbo storage costs
- Payment: USDC via x402 on Base chain`,

  'getting-started': `# Getting Started

## Prerequisites

- Node.js 18+
- A wallet (MetaMask, Phantom, etc.)
- Base chain access (for USDC payments)

## Installation

\`\`\`bash
# Clone the agent
git clone https://github.com/your-org/chronicle-agent
cd chronicle-agent

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
\`\`\`

## Configuration

Set your EVM private key in \`.env\`:

\`\`\`env
EVM_PRIVATE_KEY=0x...
\`\`\`

## Running the Agent

\`\`\`bash
# Build
npm run build

# Start
npm start
\`\`\`

## ACP Setup

1. Install ACP CLI:
\`\`\`bash
git clone https://github.com/Virtual-Protocol/openclaw-acp
cd openclaw-acp
npm install && npm link
\`\`\`

2. Initialize your agent:
\`\`\`bash
acp setup
\`\`\`

3. Launch the CHRONICLE token:
\`\`\`bash
acp token launch CHRONICLE
\`\`\`

4. Register the storage offering:
\`\`\`bash
acp sell create chronicle-storage
\`\`\`

5. Start serving:
\`\`\`bash
acp serve start
\`\`\``,

  'architecture': `# Architecture

## System Overview

\`\`\`
Users (AI Agents)
       │
       ▼ (x402 Payment in USDC)
CHRONICLE Agent
       │
       ▼ (Pass-through payment)
  Turbo Upload
       │
       ▼
  Arweave Storage
\`\`\`

## Components

### 1. Upload Service
- Handles data upload to Turbo
- Manages x402 payment flow
- Adds metadata tags

### 2. Pricing Service
- Queries Turbo pricing API
- Adds 10% markup
- Returns calculated price

### 3. Encryption Helpers
- AES-256-GCM encryption
- IV generation
- Key management utilities

## Data Flow

1. Agent receives upload request with data
2. Calculate price based on data size
3. User pays via x402 (USDC)
4. Agent forwards payment to Turbo
5. Data is uploaded to Arweave
6. Transaction ID returned to user

## Security

- All encryption is client-side
- Agent never sees unencrypted data
- Keys are managed by the client
- Arweave provides immutability`,

  'api': `# API Reference

## Upload Functions

### upload_image

Store image data on Arweave.

\`\`\`typescript
const result = await executeJob({
  data: base64ImageData,
  type: 'image',
});
\`\`\`

### upload_markdown

Store markdown content.

\`\`\`typescript
const result = await executeJob({
  data: '# My Journal\\n\\nEntry...',
  type: 'markdown',
});
\`\`\`

### upload_json

Store JSON data.

\`\`\`typescript
const result = await executeJob({
  data: JSON.stringify({ key: 'value' }),
  type: 'json',
});
\`\`\`

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`data\` | string | yes | Data to store |
| \`type\` | string | yes | One of: image, markdown, json |
| \`encrypted\` | boolean | no | Whether data is encrypted |
| \`cipherIv\` | string | no | AES-256-GCM IV (if encrypted) |

## Response

\`\`\`typescript
{
  id: string;      // Arweave transaction ID
  url: string;     // arweave.net URL
  type: string;    // image, markdown, or json
  encrypted: boolean;
  timestamp: number;
}
\`\`\`

## Pricing

- Base price: $0.01 USDC
- Formula: \`max(0.01, (bytes / 1024) * 0.001 * 1.10)\``,

  'acp': `# ACP Integration

## What is ACP?

ACP (Agent Commerce Protocol) by Virtuals Protocol enables AI agents to:
- Have persistent on-chain identities
- Sell services to other agents
- Receive payments automatically

## Setting Up

### 1. Install ACP CLI

\`\`\`bash
git clone https://github.com/Virtual-Protocol/openclaw-acp
cd openclaw-acp
npm install && npm link
\`\`\`

### 2. Initialize Agent

\`\`\`bash
acp setup
\`\`\`

This creates:
- Agent wallet on Base chain
- Session credentials
- Agent profile

### 3. Launch Token

\`\`\`bash
acp token launch CHRONICLE
\`\`\`

This creates $CHRONICLE token for the agent.

### 4. Register Offering

\`\`\`bash
acp sell init chronicle-storage
# Copy offering.json from chronicle-agent/offerings/storage/
acp sell create chronicle-storage
\`\`\`

### 5. Start Serving

\`\`\`bash
acp serve start
\`\`\`

## Offering Definition

\`\`\`json
{
  "name": "chronicle-storage",
  "description": "Permanent storage for AI agents",
  "fee": "0.01",
  "requirements": {
    "type": "object",
    "properties": {
      "data": { "type": "string" },
      "type": { "type": "string", "enum": ["image", "markdown", "json"] },
      "encrypted": { "type": "boolean" },
      "cipherIv": { "type": "string" }
    }
  }
}
\`\`\`

## Job Flow

1. Client calls ACP job endpoint
2. x402 payment is processed
3. Handler executes upload
4. Result returned to client`,
};

function App() {
  const [activeDoc, setActiveDoc] = useState('introduction');
  
  const navItems = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'api', label: 'API Reference' },
    { id: 'acp', label: 'ACP Integration' },
    { id: 'skill', label: 'Agent Skill' },
  ];

  const content = activeDoc === 'skill' 
    ? null // Will load from file
    : docs[activeDoc] || docs['introduction'];

  return (
    <div className="docs-app">
      <header className="docs-header">
        <a href="/" className="docs-logo">CHRONICLE</a>
        <span className="docs-tagline">Permanent Storage for AI Agents</span>
      </header>
      
      <div className="docs-container">
        <nav className="docs-sidebar">
          <ul className="nav-list">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={"nav-item " + (activeDoc === item.id ? 'active' : '')}
                  onClick={() => setActiveDoc(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <main className="docs-content">
          {activeDoc === 'skill' ? (
            <div className="skill-notice">
              <h2>Agent Skill</h2>
              <p>The Agent Skill documentation is available at:</p>
              <code>/skill.md</code>
              <p>Download or view the skill file directly from the frontend.</p>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;