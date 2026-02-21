import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const docs: Record<string, { title: string; content: string }> = {
  'introduction': {
    title: 'Introduction',
    content: `# CHRONICLE

Permanent storage for AI agents. Store data forever on Arweave with x402 micropayments.

## Overview

CHRONICLE is an x402-powered storage service that enables AI agents to store data permanently on Arweave. Built on Virtuals Protocol ACP, it provides:

<div class="docs-features">
  <div class="docs-feature">
    <div class="docs-feature-icon">∞</div>
    <h4>Permanent Storage</h4>
    <p>Data lives forever on Arweave blockchain</p>
  </div>
  <div class="docs-feature">
    <div class="docs-feature-icon">⚡</div>
    <h4>x402 Payments</h4>
    <p>Automatic micropayments via USDC</p>
  </div>
  <div class="docs-feature">
    <div class="docs-feature-icon">🔐</div>
    <h4>AES-256-GCM</h4>
    <p>Client-side encryption support</p>
  </div>
  <div class="docs-feature">
    <div class="docs-feature-icon">🔄</div>
    <h4>Closed-Loop</h4>
    <p>Pass-through payments, no capital needed</p>
  </div>
</div>

## Quick Links

<div class="docs-quick-links">
  <a href="#getting-started" class="docs-quick-link">→ Getting Started</a>
  <a href="#api" class="docs-quick-link">→ API Reference</a>
  <a href="#acp" class="docs-quick-link">→ ACP Integration</a>
</div>

## Use Cases

- **AI Agent Memory**: Store long-term memories and journals
- **Audit Trails**: Immutable records of decisions  
- **Encrypted Secrets**: Secure storage for sensitive data

## Pricing

- Base: **$0.01 USDC** per request
- Scaling: +10% markup over Turbo storage costs
- Payment: USDC via x402 on Base chain`},

  'getting-started': {
    title: 'Getting Started',
    content: `# Getting Started

## Prerequisites

- Node.js 18+
- A wallet (MetaMask, Phantom, etc.)
- Base chain access (for USDC payments)

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/chronicle
cd chronicle

# Install dependencies
npm install
\`\`\`

## Configuration

Copy the environment file:

\`\`\`bash
cp chronicle-agent/.env.example chronicle-agent/.env
\`\`\`

Edit \`.env\` and add your EVM private key:

\`\`\`
EVM_PRIVATE_KEY=0x...
\`\`\`

## Running the Agent

\`\`\`bash
# Start the API server
cd chronicle-agent
npm run build
npm run start:api
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
\`\`\``},

  'architecture': {
    title: 'Architecture',
    content: `# Architecture

## System Overview

\`\`\`
Users (AI Agents)
       │
       ▼ x402 Payment in USDC
CHRONICLE Agent
       │
       ▼ Pass-through payment
  Turbo Upload
       │
       ▼
  Arweave Storage
\`\`\`

## Components

### 1. Upload Service
- Handles data upload to Turbo
- Manages x402 payment flow
- Adds metadata tags for Arweave

### 2. Pricing Service
- Queries Turbo pricing API
- Adds 10% markup
- Returns calculated price

### 3. Encryption Helpers
- AES-256-GCM encryption utilities
- IV generation
- Key management functions

### 4. Database (SQLite)
- Tracks user uploads
- Enables export functionality
- Stores wallet addresses

## Data Flow

1. Agent receives upload request with data
2. Calculate price based on data size
3. User pays via x402 (USDC)
4. Agent forwards payment to Turbo
5. Data is uploaded to Arweave
6. Transaction ID returned to user

## Security

- All encryption is **client-side**
- Agent never sees unencrypted data
- Keys are managed by the client
- Arweave provides immutability`},

  'api': {
    title: 'API Reference',
    content: `# API Reference

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
| \`type\` | string | yes | One of: \`image\`, \`markdown\`, \`json\` |
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

- Base price: **$0.01 USDC**
- Formula: \`max(0.01, (bytes / 1024) * 0.001 * 1.10)\``},

  'acp': {
    title: 'ACP Integration',
    content: `# ACP Integration

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
\`\`\``},

  'skill': {
    title: 'Agent Skill',
    content: `# Agent Skill

## Quick Start for AI Agents

Install the CHRONICLE skill to enable your agent to store data:

\`\`\`bash
npx skills add https://chronicle.agent/skill.md --skill chronicle
\`\`\`

## For Developers

The full skill documentation is available at:

<div class="docs-skill-box">
  <h3>Agent Skill File</h3>
  <p>Complete API reference for programmatic access</p>
  <code class="docs-skill-code">/skill.md</code>
</div>

## Authentication

Include wallet signature in headers:

\`\`\`javascript
const signature = await wallet.signMessage('CHRONICLE auth');
headers: {
  'Authorization': \`Bearer \${address}:\${signature}\`
}
\`\`\`

## Endpoints

- \`POST /api/upload\` - Upload data
- \`GET /api/uploads\` - List user uploads  
- \`GET /api/uploads/export?format=json|csv\` - Export data`},
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

  const currentDoc = docs[activeDoc];

  return (
    <div className="docs-app">
      <header className="docs-header">
        <div className="docs-logo">
          <div className="docs-logo-icon">C</div>
          <span className="docs-logo-text">CHRONICLE</span>
        </div>
        <nav className="docs-header-nav">
          <a href="#" className="docs-header-link">Docs</a>
          <a href="#" className="docs-header-link">GitHub</a>
        </nav>
      </header>
      
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-section">
            <div className="docs-sidebar-title">Documentation</div>
            <ul className="docs-sidebar-nav">
              {navItems.map(item => (
                <li key={item.id}>
                  <a
                    href="#"
                    className={"docs-sidebar-link " + (activeDoc === item.id ? 'active' : '')}
                    onClick={(e) => { e.preventDefault(); setActiveDoc(item.id); }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        
        <main className="docs-main">
          <div className="docs-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentDoc.content}
            </ReactMarkdown>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;