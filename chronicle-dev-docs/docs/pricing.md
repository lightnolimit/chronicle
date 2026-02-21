# Pricing Strategy

## Cost Structure

CHRONICLE uses a closed-loop economic model where payments flow through to cover Arweave costs.

### Pricing Formula

```
price = max($0.01, turboCost * 1.10)
```

Where:
- `$0.01` = Base minimum fee
- `turboCost` = Cost from Turbo SDK per byte
- `1.10` = 10% markup for CHRONICLE service

### Base Pricing

| Component | Cost |
|-----------|------|
| Base fee per request | $0.01 USD |
| Turbo markup | 10% over cost |
| Minimum charge | $0.01 |

### Example Calculations

**Small markdown file (1KB)**
- Turbo cost: ~$0.001
- Markup (10%): ~$0.0001
- Base fee: $0.01
- **Total: $0.01** (minimum)

**Medium JSON file (100KB)**
- Turbo cost: ~$0.001
- Markup (10%): ~$0.0001
- Base fee: $0.01
- **Total: $0.011**

**Large image (1MB)**
- Turbo cost: ~$0.01
- Markup (10%): ~$0.001
- Base fee: $0.01
- **Total: $0.021**

## Revenue Model

### Closed-Loop Economics

1. User pays USDC to CHRONICLE agent
2. Agent uses portion to pay Turbo
3. Agent keeps markup for sustainability
4. No external dependencies on pricing

### Sustainable Pricing

The 10% markup covers:
- Server infrastructure
- API maintenance
- Agent development
- Future feature development

## Payment Flow

```
User Wallet (USDC)
        │
        ▼
    x402 Payment Header
        │
        ▼
    CHRONICLE Agent
        │
        ├──▶ Base Fee ($0.01) ──▶ CHRONICLE Treasury
        │
        └──▶ Storage Cost ──▶ Turbo (Arweave)
```

## Price Discovery

### Client-Side Calculation

The frontend calculates price locally for immediate feedback:

```typescript
const MARKUP_PERCENT = 10;
const BASE_PRICE_USD = 0.01;
const TURBO_COST_PER_BYTE = 0.000000001;

function calculatePriceLocal(sizeBytes: number): number {
  const turboCost = sizeBytes * TURBO_COST_PER_BYTE;
  const userPrice = Math.max(
    BASE_PRICE_USD, 
    turboCost * (1 + MARKUP_PERCENT / 100)
  );
  return Math.round(userPrice * 100) / 100;
}
```

### Server-Side Calculation

Turbo prices can also be fetched dynamically:

```typescript
const turboPrice = await fetch(
  `https://ardrive.net/price/${dataSizeBytes}`
);
```

**Note:** The client-side calculation uses an estimated Turbo cost of $0.000000001 per byte. The actual cost may vary slightly, but the 10% markup ensures CHRONICLE always covers costs while generating revenue.

## Future Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 10 uploads/day |
| Pro | $10/month | Unlimited + priority |
| Enterprise | Custom | SLA + support |

## Virtuals ACP Pricing

For agent-to-agent transactions:

```json
{
  "pricing": {
    "model": "per_request",
    "basePrice": 0.01,
    "currency": "USDC",
    "network": "base"
  }
}
```
