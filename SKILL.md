# Phala Deployment Guide

## Overview

This guide documents how to deploy to Phala Cloud with Docker Hub images.

## Architecture

- **Frontend**: React + Vite + Wagmi UI (port 80)
- **Backend**: Node.js Express API with x402 payments (port 3001)
- **Storage**: Arweave via Turbo SDK
- **Payments**: USDC on Base via x402 protocol

## Prerequisites

1. **Docker Hub account** with push access
2. **Phala Cloud account** 
3. **Build server** (x86_64/amd64 architecture) - cannot build on Apple Silicon Mac
4. **Environment variables**:
   - `EVM_PRIVATE_KEY`: Private key for signing payments (0x prefix)
   - `EVM_ADDRESS`: Address to receive USDC payments
   - `NETWORK`: `base` (mainnet) or `base-sepolia` (testnet)
   - `CHUTES_API_KEY`: API key from chutes.ai

## Build Process (On x86_64 Server)

### Option 1: Build on Hetzner (Recommended)

```bash
# SSH to build server
ssh hetzner-phantasy-001

# Clone repo
cd /home/phantasy/chronicle

# Fix Dockerfile path (if needed)
sed -i 's|dist/server.js|dist/src/server.js|g' agent/Dockerfile

# Build images
docker build -t phantasybot/chronicle-agent:latest ./agent
docker build -t phantasybot/chronicle-frontend:latest ./frontend

# Push to Docker Hub
docker push phantasybot/chronicle-agent:latest
docker push phantasybot/chronicle-frontend:latest
```

### Option 2: Build Locally with Platform Flag

```bash
docker build --platform linux/amd64 -t phantasybot/chronicle-agent:latest ./agent
docker build --platform linux/amd64 -t phantasybot/chronicle-frontend:latest ./frontend
docker push phantasybot/chronicle-agent:latest
docker push phantasybot/chronicle-frontend:latest
```

## Deploy to Phala

### Step 1: Create docker-compose.phala.yml

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

### Step 2: Deploy with Phala CLI

```bash
# Deploy new CVM
phala deploy --name chronicle \
  --compose docker-compose.phala.yml \
  -e EVM_PRIVATE_KEY=0x... \
  -e EVM_ADDRESS=0x... \
  -e NETWORK=base \
  -e CHUTES_API_KEY=...

# Or update existing CVM
phala deploy --cvm-id <CVM_ID> \
  --compose docker-compose.phala.yml \
  -e EVM_PRIVATE_KEY=0x... \
  -e EVM_ADDRESS=0x... \
  -e NETWORK=base \
  -e CHUTES_API_KEY=...
```

### Step 3: Wait for Deployment

```bash
# Check status
phala cvms get <CVM_ID>

# Wait for running status (may take 5-10 minutes)
```

## Troubleshooting

### Issue: "no matching manifest for linux/amd64"

**Cause**: Images built on Apple Silicon Mac (arm64) instead of x86_64  
**Fix**: Rebuild on x86_64 server (Hetzner) with `docker build` (no --platform flag needed on x86_64)

### Issue: "Cannot find module '/app/dist/server.js'"

**Cause**: Dockerfile has wrong path - the file is at `dist/src/server.js` not `dist/server.js`  
**Fix**: Update agent/Dockerfile:
```dockerfile
CMD ["node", "dist/src/server.js"]
```

### Issue: Containers running but not responding (ERR_EMPTY_RESPONSE)

**Cause**: Usually environment variables not passed correctly, or container crash loop  
**Fix**: Check logs with `phala cvms logs <CVM_ID>`

### Issue: Nginx error "host not found in upstream 'agent'"

**Cause**: Frontend nginx config proxies to `agent:3001` but only frontend is deployed  
**Fix**: Deploy both services together or use standalone nginx config

## DNS & Custom Domain

### Option 1: Cloudflare Worker (Recommended for API + Frontend)

This is the recommended approach when you need both a frontend and API with custom domains.

#### Step 1: Create Worker Directory

```bash
mkdir -p workers/api-proxy/src
```

#### Step 2: Create wrangler.toml

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

#### Step 3: Create src/index.ts

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

#### Step 4: Deploy Worker

```bash
# Get your Cloudflare API token from .env.phala
CLOUDFLARE_API_TOKEN=... npx wrangler deploy --env production --config workers/api-proxy/wrangler.toml
```

#### Step 5: Configure DNS CNAMEs

Get your zone ID from Cloudflare API:
```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer <TOKEN>" | jq '.result[] | select(.name=="chronicle.sh") | .id'
```

Delete old A records and create CNAMEs:
```bash
# Delete old A record for api.chronicle.sh
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records/<RECORD_ID>" \
  -H "Authorization: Bearer <TOKEN>"

# Create CNAME for API
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"api.chronicle.sh","content":"<app_id>-3001.dstack-pha-prod5.phala.network","proxied":true}'

# Create CNAME for Frontend
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"app.chronicle.sh","content":"<app_id>.dstack-pha-prod5.phala.network","proxied":true}'
```

#### Step 6: Verify

```bash
# Test frontend
curl -sI https://app.chronicle.sh/

# Test API
curl -sI https://api.chronicle.sh/api/offerings
```

---

### Option 2: Simple CNAME (No Worker)

For simple deployments without API routing, use direct CNAMEs:

```bash
# Create CNAME pointing directly to Phala
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"api.chronicle.sh","content":"<app_id>-3001.dstack-pha-prod5.phala.network","proxied":true}'
```

Note: This only works for the specific port - no path routing.

### Note on Cloudflare Access

If Cloudflare Access (Zero Trust) is enabled, you may get redirected to authentication. Either:
1. Disable the Access policy for the domain
2. Use a different subdomain without Access

## API Endpoints

Once deployed:
- **Frontend**: `https://<app_id>.dstack-pha-prod5.phala.network/`
- **API**: `https://<app_id>-3001.dstack-pha-prod5.phala.network/`

The API returns "Cannot GET /" for root - this is normal. Use specific endpoints like `/api/offerings`.

## Files Changed

Key files for deployment:
- `agent/Dockerfile` - Fixed path to `dist/src/server.js`
- `docker-compose.phala.yml` - Phala-optimized compose file
- `agent/src/server.ts` - Fixed getBody() call for x402 compatibility
