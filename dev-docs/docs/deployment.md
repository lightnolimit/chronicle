# Deployment Guide

This guide covers deploying Chronicle to Phala Cloud with custom Cloudflare domains.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                           │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │ app.*       │    │ api.*       │   Custom Domains      │
│  └──────┬──────┘    └──────┬──────┘                        │
│         │                  │                                │
│         ▼                  ▼                                │
│  ┌─────────────────────────────────────┐                   │
│  │     Cloudflare Worker (proxy)       │                   │
│  └──────────────────┬──────────────────┘                   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼ (CNAME)
┌─────────────────────┼───────────────────────────────────────┐
│                     ▼          Phala Cloud (prod5)          │
│  ┌─────────────────────┐  ┌─────────────────────────┐      │
│  │ Frontend (nginx)    │  │ Agent (Express API)     │      │
│  │ Port 80             │  │ Port 3001               │      │
│  └─────────────────────┘  └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Docker Hub account** with push access
2. **Phala Cloud account** with CLI installed
3. **x86_64 build server** (Hetzner) - cannot build on Apple Silicon
4. **Cloudflare account** with API token
5. **Environment variables**:
   - `EVM_PRIVATE_KEY`: Private key for x402 payments (0x prefix)
   - `EVM_ADDRESS`: Address to receive USDC payments
   - `NETWORK`: `base` (mainnet) or `base-sepolia` (testnet)
   - `CHUTES_API_KEY`: API key from chutes.ai

## Step 1: Build Docker Images

### On Hetzner (Required for cross-platform builds)

```bash
# SSH to build server
ssh hetzner-phantasy-001

# Navigate to chronicle
cd /home/phantasy/chronicle

# Build and push
docker build -t phantasybot/chronicle-agent:latest ./agent
docker build -t phantasybot/chronicle-frontend:latest ./frontend

docker push phantasybot/chronicle-agent:latest
docker push phantasybot/chronicle-frontend:latest
```

## Step 2: Deploy to Phala

### Create compose file (docker-compose.phala.yml)

```yaml
services:
  agent:
    image: phantasybot/chronicle-agent:latest
    environment:
      EVM_PRIVATE_KEY: ${EVM_PRIVATE_KEY}
      EVM_ADDRESS: ${EVM_ADDRESS}
      NETWORK: ${NETWORK:-base}
      PORT: 3001
      CHUTES_API_KEY: ${CHUTES_API_KEY}
    ports:
      - "3001:3001"

  frontend:
    image: phantasybot/chronicle-frontend:latest
    depends_on:
      - agent
    ports:
      - "80:80"
```

### Deploy

```bash
# Get env vars from .env.phala
source .env.phala

# Deploy
phala deploy --name chronicle \
  --compose docker-compose.phala.yml \
  -e EVM_PRIVATE_KEY="$EVM_PRIVATE_KEY" \
  -e EVM_ADDRESS="$EVM_ADDRESS" \
  -e NETWORK="$NETWORK" \
  -e CHUTES_API_KEY="$CHUTES_API_KEY"
```

### Note URLs

After deployment, Phala will provide:
- **Frontend**: `https://<app_id>.dstack-pha-prod5.phala.network/`
- **Agent**: `https://<app_id>-3001.dstack-pha-prod5.phala.network/`

Save the `<app_id>` for the next steps.

## Step 3: Deploy Cloudflare Worker

The Cloudflare Worker routes traffic from your custom domains to the correct Phala backends.

### Create worker files

```bash
mkdir -p workers/api-proxy/src
```

### wrangler.toml

```toml
name = "chronicle-api-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "api.chronicle.sh/*", zone_name = "chronicle.sh" },
  { pattern = "app.chronicle.sh/*", zone_name = "chronicle.sh" },
]

[env.production.vars]
AGENT_URL = "https://<app_id>-3001.dstack-pha-prod5.phala.network"
FRONTEND_URL = "https://<app_id>.dstack-pha-prod5.phala.network"
```

### src/index.ts

```typescript
export interface Env {
  AGENT_URL: string;
  FRONTEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    let targetUrl: string;

    if (hostname === "api.chronicle.sh") {
      targetUrl = `${env.AGENT_URL}${url.pathname}${url.search}`;
    } else if (hostname === "app.chronicle.sh") {
      targetUrl = `${env.FRONTEND_URL}${url.pathname}${url.search}`;
    } else {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers(request.headers);
    headers.set("Host", url.hostname);
    headers.delete("cf-connecting-ip");
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(proxyRequest);
      
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.delete("cf-ray");
      responseHeaders.delete("x-served-by");
      responseHeaders.delete("x-cache");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(`Proxy error: ${error}`, { status: 502 });
    }
  },
};
```

### Deploy worker

```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler deploy --env production --config workers/api-proxy/wrangler.toml
```

## Step 4: Configure DNS

### Get zone ID

```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer <TOKEN>" | jq '.result[] | select(.name=="chronicle.sh") | .id'
```

### Delete old records (if any)

```bash
# Find and delete old A records for api.chronicle.sh
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" | jq '.result[] | select(.name=="api.chronicle.sh") | .id'
```

### Create CNAMEs

```bash
# API -> Agent
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"api.chronicle.sh","content":"<app_id>-3001.dstack-pha-prod5.phala.network","proxied":true}'

# App -> Frontend
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"app.chronicle.sh","content":"<app_id>.dstack-pha-prod5.phala.network","proxied":true}'
```

## Step 5: Verify

```bash
# Test direct Phala URLs (should work)
curl -sI https://<app_id>.dstack-pha-prod5.phala.network/
curl -sI https://<app_id>-3001.dstack-pha-prod5.phala.network/

# Test custom domains (should work after DNS propagates)
curl -sI https://app.chronicle.sh/
curl -sI https://api.chronicle.sh/api/offerings
```

## Troubleshooting

### Custom domains return 525 (Origin Pull Failure)

1. **Check Worker routes** - Ensure routes include `/*`:
   ```toml
   # WRONG
   { pattern = "api.chronicle.sh", zone_name = "chronicle.sh" }
   # CORRECT
   { pattern = "api.chronicle.sh/*", zone_name = "chronicle.sh" }
   ```

2. **Check Cloudflare Access policies** - Account-level Access may be blocking requests

3. **Verify DNS is proxied** - CNAMEs must have `proxied: true`

### Direct Phala URLs work but custom domains don't

1. Check Worker is deployed: `npx wrangler deploy --config workers/api-proxy/wrangler.toml`
2. Verify routes are attached: `npx wrangler routes list`
3. Check DNS CNAMEs point to correct Phala URLs

### Worker not routing to correct backend

1. Update `wrangler.toml` with correct `AGENT_URL` and `FRONTEND_URL`
2. Redeploy: `npx wrangler deploy --env production --config workers/api-proxy/wrangler.toml`

## Payment Receiver Address

### MetaMask "Untrusted EOA" Warning

When users make payments, they may see a MetaMask warning about the payment receiver address being an "untrusted EOA". This is normal and safe.

**Why this happens:**
- Your payment address (`0x19E2b55Ec6B5916bA8061248D532085e036Cdc25`) is an EOA (Externally Owned Account) - a regular wallet address, not a smart contract
- MetaMask flags all EOAs as "untrusted" because they can't be audited like smart contracts
- This is MetaMask's security feature, not an issue with Chronicle

**Is it safe?**
Yes. The address is controlled by the agent's secure wallet. Payments go directly to this wallet for settling Turbo uploads and covering AI generation costs. Users can safely proceed with the transaction.

### Current Payment Address

| Property | Value |
|----------|-------|
| Address | `0x19E2b55Ec6B5916bA8061248D532085e036Cdc25` |
| Network | Base (mainnet) |
| Token | USDC |

### Roadmap: Smart Contract Payment Receiver

To eliminate the MetaMask warning and add additional security, we plan to deploy a smart contract payment receiver:

- [ ] Deploy a smart contract wallet that receives USDC payments
- [ ] Verify contract code on Basescan
- [ ] Update x402 configuration to use new contract address

The contract would allow for:
- Auditable, verifiable code
- Potential for automatic fund distribution
- Multi-sig support for added security

## Files Modified

- `docker-compose.phala.yml` - Phala deployment compose
- `workers/api-proxy/wrangler.toml` - Worker configuration
- `workers/api-proxy/src/index.ts` - Worker routing logic
- `.env.phala` - Environment variables (do not commit)

## Current Deployment

| Service | Custom Domain | Phala URL |
|---------|--------------|-----------|
| Frontend | app.chronicle.sh | ba81c3e557574e3950cb97fbe1f0fa0855c70e0d.dstack-pha-prod5.phala.network |
| Agent | api.chronicle.sh | ba81c3e557574e3950cb97fbe1f0fa0855c70e0d-3001.dstack-pha-prod5.phala.network |
