# CHRONICLE - Agent Skill

Permanent storage for AI agents using Arweave + Turbo + x402 payments.

## Quick Start

### Install as Agent Skill

```bash
npx skills add https://chronicle.agent/skill.md --skill chronicle
```

Or fetch manually:

```bash
curl -s https://chronicle.agent/skill.md
```

## Payment Configuration

**Network:** Base (eip155:8453) - Base Mainnet  
**Payment Token:** USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)  
**Payment Receiver:** 0x19E2b55Ec6B5916bA8061248D532085e036Cdc25

## x402 Payment Flow

Chronicle uses x402 protocol for automatic micropayments. The server returns a `402 Payment Required` response with payment requirements.

### Step 1: Initial Request

```javascript
const response = await fetch('https://chronicle.agent/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${walletAddress}:sig`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'markdown',
    data: '# My Document'
  })
});
```

### Step 2: Handle 402 Response

If payment is required, the server returns:

```javascript
// Extract payment requirements from headers
const paymentRequired = response.headers.get('payment-required');
const { accepts, payTo, amount, network } = JSON.parse(atob(paymentRequired));
```

### Step 3: Sign EIP-3009 Authorization

Use EIP-712 signing (NOT signMessage):

```javascript
const DOMAIN = {
  name: 'USD Coin',
  version: '2',
  chainId: 8453,
  verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

const TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
};

const now = Math.floor(Date.now() / 1000);
const nonce = '0x' + crypto.getRandomValues(new Uint8Array(32)).map(b => b.toString(16).padStart(2, '0')).join('');

const message = {
  from: walletAddress,
  to: payTo,
  value: amount,
  validAfter: now.toString(),
  validBefore: (now + 300).toString(),
  nonce
};

const signature = await wallet.signTypedData({
  domain: DOMAIN,
  types: TYPES,
  primaryType: 'TransferWithAuthorization',
  message
});
```

### Step 4: Build Payment Header

```javascript
const authorization = {
  from: walletAddress,
  to: payTo,
  value: amount,
  validAfter: now.toString(),
  validBefore: (now + 300).toString(),
  nonce
};

const paymentHeader = btoa(JSON.stringify({
  x402Version: 2,
  scheme: 'exact',
  network,
  accepts,
  payload: { signature, authorization },
  extensions: {}
}));
```

### Step 5: Retry Request with Payment

```javascript
const finalResponse = await fetch('https://chronicle.agent/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${walletAddress}:sig`,
    'PAYMENT-SIGNATURE': paymentHeader,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'markdown',
    data: '# My Document'
  })
});
```

## Complete Agent Example

```javascript
async function uploadToChronicle(wallet, data, type = 'markdown') {
  const WALLET_ADDRESS = await wallet.getAddress();
  const API_URL = 'https://chronicle.agent/api/upload';
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const CHAIN_ID = 8453;

  const EIP3009_DOMAIN = {
    name: 'USD Coin',
    version: '2',
    chainId: CHAIN_ID,
    verifyingContract: USDC_ADDRESS
  };

  const EIP3009_TYPES = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  };

  // Helper to generate 32-byte nonce
  function generateNonce() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Make request, handle 402 if needed
  async function makeRequest(paymentHeader) {
    return fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WALLET_ADDRESS}:sig`,
        ...(paymentHeader && { 'PAYMENT-SIGNATURE': paymentHeader }),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type, data })
    });
  }

  let response = await makeRequest();

  // Handle payment required
  if (response.status === 402) {
    const paymentRequired = response.headers.get('payment-required');
    if (!paymentRequired) throw new Error('Payment required but no header found');

    const decoded = JSON.parse(atob(paymentRequired));
    const { accepts, payTo, amount, network } = accepts[0];

    const now = Math.floor(Date.now() / 1000);
    const nonce = generateNonce();

    const signature = await wallet.signTypedData({
      domain: EIP3009_DOMAIN,
      types: EIP3009_TYPES,
      primaryType: 'TransferWithAuthorization',
      message: {
        from: WALLET_ADDRESS,
        to: payTo,
        value: amount,
        validAfter: now.toString(),
        validBefore: (now + 300).toString(),
        nonce
      }
    });

    const paymentHeader = btoa(JSON.stringify({
      x402Version: 2,
      scheme: 'exact',
      network,
      accepts,
      payload: {
        signature,
        authorization: {
          from: WALLET_ADDRESS,
          to: payTo,
          value: amount,
          validAfter: now.toString(),
          validBefore: (now + 300).toString(),
          nonce
        }
      },
      extensions: {}
    }));

    response = await makeRequest(paymentHeader);
  }

  return response.json();
}

// Usage
const result = await uploadToChronicle(wallet, '# Hello World', 'markdown');
console.log('Uploaded:', result.url);
```

## Upload Image

```javascript
// Convert image to base64
const imageBase64 = fs.readFileSync('image.png').toString('base64');
const dataUrl = `data:image/png;base64,${imageBase64}`;

await uploadToChronicle(wallet, dataUrl, 'image');
```

## Upload JSON

```javascript
const jsonData = JSON.stringify({ key: 'value', timestamp: Date.now() });
await uploadToChronicle(wallet, jsonData, 'json');
```

## List Your Uploads

```bash
curl -sS https://chronicle.agent/api/uploads \
  -H "Authorization: Bearer ${ADDRESS}:sig"
```

Response:

```json
{
  "uploads": [
    {
      "id": "abc123...",
      "url": "https://arweave.net/xyz789",
      "type": "markdown",
      "size_bytes": 1234,
      "cost_usd": 0.01,
      "created_at": "2026-02-21T12:00:00Z"
    }
  ]
}
```

## Response Format

```json
{
  "success": true,
  "id": "arweave_transaction_id",
  "url": "https://arweave.net/arweave_transaction_id",
  "type": "markdown",
  "size_bytes": 1234,
  "cost_usd": 0.011,
  "timestamp": 1708526400000
}
```

## Pricing

- Base: $0.01 USDC per upload
- + 10% markup over Turbo/Arweave storage costs
- Payment: Automatic via x402 (USDC on Base)

## Limits

| Tier | Max Size |
|------|----------|
| Default | ~10 MB per upload |

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Missing or invalid signature |
| INVALID_TYPE | Type must be: image, markdown, or json |
| UPLOAD_FAILED | Turbo/Arweave error |
| PAYMENT_FAILED | x402 payment signature rejected or invalid |

## Support

- GitHub: https://github.com/your-org/chronicle
- Discord: https://discord.gg/chronicle
