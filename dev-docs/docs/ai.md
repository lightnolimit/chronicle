# AI Endpoints (Internal)

AI features are available only on Base mainnet and require `CHUTES_API_KEY`.

## Availability

- `NETWORK=base` is required
- `CHUTES_API_KEY` must be set
- Check status via `GET /api/ai/status`

## Endpoints

- `POST /api/ai/text`
- `POST /api/ai/image`
- `POST /api/ai/image-edit`
- `POST /api/ai/video`
- `POST /api/ai/agent`
- `POST /api/ai/execute`

## Pricing (Fixed)

- text: $0.01
- image: $0.05
- image-edit: $0.05
- video: $0.10
- agent: $0.02
- execute: $0.05

## Notes

- These endpoints use Chutes.ai backends (`agent/src/handlers/ai_generate.ts`).
- Responses are proxied directly from the providers.
