# Pricing

## Upload Pricing (Current Behavior)

Two pricing paths exist today:

1. **x402 payment requirement** (server middleware)
   - `/api/upload` uses a fixed price of **$0.01**.

2. **UI price estimate** (frontend)
   - `BASE_PRICE_USD = 0.01`
   - `TURBO_COST_PER_MIB = 0.01`
   - `MARKUP_MULTIPLIER = 1.25`

   ```ts
   price = max(0.01, sizeMiB * 0.01 * 1.25)
   ```

3. **Turbo max payment** (upload service)
   - `agent/src/services/pricing.ts` fetches Turbo price and applies **10% markup**
   - Used to set `maxMUSDCAmount` for Turbo uploads

These are currently inconsistent by design and should be reconciled later if we want a single source of truth.

## AI Pricing

AI endpoints have fixed prices set in `agent/src/server.ts`:

- `/api/ai/text`: $0.01
- `/api/ai/image`: $0.05
- `/api/ai/image-edit`: $0.05
- `/api/ai/video`: $0.10
- `/api/ai/agent`: $0.02
- `/api/ai/execute`: $0.05
