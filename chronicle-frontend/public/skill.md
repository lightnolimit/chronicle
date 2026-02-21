# CHRONICLE - Agent Skill

Permanent storage for AI agents using Arweave + x402 payments.

## Quick Start

### Install as Agent Skill

```bash
npx skills add https://chronicle.agent/skill.md --skill chronicle
```

Or fetch manually:

```bash
curl -s https://chronicle.agent/skill.md
```

## Authentication

Include wallet signature in headers:

```javascript
// Sign a message with the wallet
const signature = await wallet.signMessage('CHRONICLE auth');

// Include in requests
headers: {
  'Authorization': `Bearer ${address}:${signature}`,
  'Content-Type': 'application/json'
}
```

## Upload Image

```bash
curl -sS https://chronicle.agent/api/upload \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "data": "data:image/png;base64,iVBORw0KGgo...",
    "encrypted": false
  }'
```

## Upload Markdown

```bash
curl -sS https://chronicle.agent/api/upload \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "markdown",
    "data": "# My Journal\n\nToday I learned about..."
  }'
```

## Upload JSON

```bash
curl -sS https://chronicle.agent/api/upload \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "json",
    "data": "{\"key\": \"value\", \"timestamp\": 1234567890}"
  }'
```

## Encrypted Upload

```javascript
// Client-side encryption before upload
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

const cipherIv = btoa(String.fromCharCode(...iv));
const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

await fetch('https://chronicle.agent/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${address}:${signature}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'json',
    data: encryptedData,
    encrypted: true,
    cipherIv
  })
});
```

## List Your Uploads

```bash
curl -sS https://chronicle.agent/api/uploads \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}"
```

Response:

```json
{
  "uploads": [
    {
      "id": "abc123...",
      "url": "https://arweave.net/xyz789",
      "type": "markdown",
      "encrypted": false,
      "size_bytes": 1234,
      "cost_usd": 0.01,
      "created_at": "2026-02-21T12:00:00Z"
    }
  ]
}
```

## Export Uploads

```bash
# JSON export
curl -sS "https://chronicle.agent/api/uploads/export?format=json" \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}"

# CSV export
curl -sS "https://chronicle.agent/api/uploads/export?format=csv" \
  -H "Authorization: Bearer ${ADDRESS}:${SIGNATURE}"
```

## Response Format

All upload responses:

```json
{
  "success": true,
  "id": "arweave_transaction_id",
  "url": "https://arweave.net/arweave_transaction_id",
  "type": "markdown",
  "encrypted": false,
  "size_bytes": 1234,
  "cost_usd": 0.011,
  "timestamp": 1708526400000
}
```

## Pricing

- Base: $0.01 USDC per request
- Scaling: (size_kb × $0.001) × 1.10
- Payment: Automatic via x402 (USDC on Base)

## Limits

| Tier | Max Size | Expiry |
|------|----------|--------|
| Free | 1 MB | Permanent |
| Pro | 100 MB | Permanent |

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Missing or invalid signature |
| `INVALID_TYPE` | Type must be: image, markdown, or json |
| `ENCRYPTION_ERROR` | Invalid cipher IV |
| `UPLOAD_FAILED` | Turbo/Arweave error |
| `RATE_LIMITED` | Too many requests |

## Support

- GitHub: https://github.com/your-org/chronicle-agent
- Discord: https://discord.gg/chronicle
