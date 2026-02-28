# Pricing

## Upload Pricing (Single Source of Truth)

All upload pricing now comes from `agent/src/services/pricing.ts` and is applied consistently across:

- x402 payment requirement for `POST /api/upload`
- `/api/price` endpoint
- UI price display (frontend calls `/api/price`)
- Turbo `maxMUSDCAmount` for uploads

### Pricing Logic

1. Fetch Turbo price from `https://ardrive.net/price/:bytes`
2. Convert to USD (winston → USD)
3. Apply **10% markup**
4. Enforce minimum **$0.01**

```ts
priceUsd = max(0.01, turboCostUsd * 1.10)
```

### Fallback

If the Turbo pricing API fails, a fallback estimate is used:

```ts
turboCostUsd = (bytes / 1024) * 0.001
priceUsd = max(0.01, turboCostUsd * 1.10)
```

## AI Pricing

AI endpoints have fixed prices set in `agent/src/server.ts`:

- `/api/ai/text`: $0.01
- `/api/ai/image`: $0.05
- `/api/ai/image-edit`: $0.05
- `/api/ai/video`: $0.10
- `/api/ai/agent`: $0.02
- `/api/ai/execute`: $0.05
