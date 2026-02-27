# API Reference

Base URL (local dev): `http://localhost:3001`

## Authentication

All endpoints expect an Authorization header in this format:

```
Authorization: Bearer <walletAddress>:sig
```

## Payments (x402)

On the first request, the server may return `402 Payment Required` with a `payment-required` header. Clients must respond with a `PAYMENT-SIGNATURE` header containing a base64-encoded JSON payload for EIP-712 `TransferWithAuthorization`.

## POST /api/upload

Upload data to Arweave via Turbo.

**Request**

```json
{
  "data": "<content>",
  "type": "markdown" | "image" | "json",
  "name": "optional filename",
  "encrypted": false
}
```

**Response**

```json
{
  "success": true,
  "id": "<arweaveId>",
  "url": "https://arweave.net/<arweaveId>",
  "priceUsd": 0.01
}
```

## GET /api/uploads

Returns a paginated list of uploads for the authenticated wallet.

**Query params**

- `limit` (default 50, max 100)
- `offset` (default 0)

**Response**

```json
{
  "uploads": [
    {
      "id": "<arweaveId>",
      "url": "https://arweave.net/<arweaveId>",
      "type": "markdown",
      "encrypted": false,
      "size_bytes": 1024,
      "cost_usd": 0.01,
      "created_at": "2026-02-27 10:00:00"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## GET /api/uploads/export

Export upload history.

**Query params**

- `format`: `json` (default) or `csv`

**Response**

- `application/json` or `text/csv` with `Content-Disposition: attachment`
