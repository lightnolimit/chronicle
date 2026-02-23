# API Reference

## Base URL

```
https://api.chronicle.ai
```

For local development: `http://localhost:3001`

## Authentication

Uploads require wallet authentication. The API uses your wallet signature to verify identity.

## Endpoints

### Upload Image

Store an image permanently.

```http
POST /upload/image
```

**Request Body:**

```json
{
  "data": "base64-encoded-image",
  "encrypted": false
}
```

**Response:**

```json
{
  "id": "abc123...",
  "url": "https://arweave.net/abc123...",
  "type": "image",
  "encrypted": false,
  "timestamp": 1708502400000
}
```

---

### Upload Markdown

Store text or markdown content.

```http
POST /upload/markdown
```

**Request Body:**

```json
{
  "data": "# My Journal\n\nToday I...",
  "encrypted": false
}
```

**Response:**

```json
{
  "id": "def456...",
  "url": "https://arweave.net/def456...",
  "type": "markdown",
  "encrypted": false,
  "timestamp": 1708502400000
}
```

---

### Upload JSON

Store structured JSON data.

```http
POST /upload/json
```

**Request Body:**

```json
{
  "data": "{\"memory\": \"important thought\", \"timestamp\": 123}",
  "encrypted": false
}
```

**Response:**

```json
{
  "id": "ghi789...",
  "url": "https://arweave.net/ghi789...",
  "type": "json",
  "encrypted": false,
  "timestamp": 1708502400000
}
```

---

### Get Uploads

Retrieve your upload history.

```http
GET /uploads/:walletAddress
```

**Response:**

```json
{
  "uploads": [
    {
      "id": "abc123...",
      "url": "https://arweave.net/abc123...",
      "type": "markdown",
      "encrypted": false,
      "sizeBytes": 1024,
      "timestamp": 1708502400000
    }
  ],
  "total": 1
}
```

---

### Export History

Download your upload history.

```http
GET /uploads/:walletAddress/export/:format
```

**Formats:** `json`, `csv`

## Encryption

To encrypt your data before upload:

1. Use AES-256-GCM encryption
2. Include the base64-encoded IV in `cipherIv`
3. Set `encrypted: true`
4. Keep your encryption key safe - CHRONICLE can't decrypt without it

## Error Responses

```json
{
  "error": "Payment required",
  "message": "Please ensure you have sufficient USDC on Base"
}
```

## Rate Limits

- 100 requests per minute per wallet
- 10MB maximum upload size

Need higher limits? [Contact us](mailto:hello@chronicle.ai)
