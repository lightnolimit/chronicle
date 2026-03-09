# Virtuals Protocol ACP Integration

Chronicle uses ACP as a separate agent-to-agent channel alongside its direct x402 API.

## Runtime Model

- `agent-api`: human-facing API for x402 uploads and AI endpoints
- `agent-acp`: long-lived ACP seller runtime that listens for Virtuals jobs
- `frontend`: Chronicle UI

The API and ACP services share the same codebase and business logic, but they run as separate processes in production.

## Current ACP Catalog

Registered now:

| Offering ID | Description | Fee | SLA |
|-------------|-------------|-----|-----|
| `chronicle_store_64kb` | Store markdown, JSON, or image payloads up to 64KB | $0.09 | 5 min |
| `chronicle_store_256kb` | Store markdown, JSON, or image payloads up to 256KB | $0.36 | 10 min |
| `chronicle_ai_text` | Text generation | $0.07 | 5 min |

Implemented but disabled until soak-tested:

| Offering ID | Description | Fee | SLA |
|-------------|-------------|-----|-----|
| `chronicle_ai_image` | Generate image and return persistent URL | $0.13 | 10 min |
| `chronicle_ai_video` | Generate video and return URL | $1.25 | 20 min |

## Environment

Add to `agent/.env`:

```bash
ACP_ENABLED=true
ACP_WHITELISTED_WALLET_PRIVATE_KEY=0x...
ACP_SESSION_KEY_ID=12345
ACP_AGENT_WALLET=0x...
ACP_NETWORK=base
ACP_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-key
ACP_QUEUE_DEPTH=10
ACP_CONCURRENCY_STORAGE=2
ACP_CONCURRENCY_TEXT=2
ACP_CONCURRENCY_IMAGE=1
ACP_CONCURRENCY_VIDEO=1
ACP_ENABLE_IMAGE_OFFERING=false
ACP_ENABLE_VIDEO_OFFERING=false
```

## Local Commands

```bash
cd agent
npm run dev:api   # API only
npm run dev:acp   # ACP seller only
npm run dev       # Combined local runner
```

## ACP Job Lifecycle

Chronicle follows the seller-side ACP v2 flow:

1. Buyer creates job from a registered Chronicle offering.
2. Chronicle receives a `REQUEST`, validates requirements, calls `job.accept()`, then `job.createRequirement(...)`.
3. Buyer pays during `NEGOTIATION`.
4. Chronicle receives `TRANSACTION`, executes the job, and calls `job.deliver(...)`.
5. Buyer/evaluator completes the job.

Chronicle does **not** call `job.payAndAcceptRequirement()` on the seller side.

## Resource URLs

- `chronicle_catalog`: `https://api.chronicle.sh/api/acp/catalog`
- `chronicle_price_estimator`: `https://api.chronicle.sh/api/price?size={{size}}`

## Notes

- Use `ACP_WHITELISTED_WALLET_PRIVATE_KEY` for ACP memo signing; keep `EVM_PRIVATE_KEY` dedicated to Turbo/x402 upload funding.
- The public `skill.md` is a direct x402 integration surface. It is useful for non-ACP agents, but it is not part of Chronicle's ACP compliance story.
- Chronicle should complete at least 10 successful sandbox jobs before graduation submission.
