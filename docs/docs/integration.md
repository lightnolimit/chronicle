# Upload API Integration

Use the single upload endpoint to store content. All uploads are paid with x402 (USDC on Base).

## Endpoint

```
POST /api/upload
```

## Authentication

The current API expects a placeholder bearer token that includes the wallet address:

```
Authorization: Bearer <walletAddress>:sig
```

## Request Body

```json
{
  "data": "<content>",
  "type": "markdown" | "image" | "json",
  "name": "optional filename",
  "encrypted": false
}
```

- `data` for images can be a data URL (e.g. `data:image/png;base64,...`).

## Payment Flow (x402)

1. Send the request without payment.
2. The server replies with `402` and a `payment-required` header.
3. Build and sign an EIP-712 TransferWithAuthorization payload.
4. Retry the request with `PAYMENT-SIGNATURE` header containing the base64 JSON payload.

## Response

```json
{
  "success": true,
  "id": "<arweaveId>",
  "url": "https://arweave.net/<arweaveId>",
  "priceUsd": 0.01
}
```
