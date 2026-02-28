# Virtuals ACP (Planned + In Progress)

CHRONICLE is planned to be listed as a storage offering on Virtuals Protocol ACP.

## Current Offering

See `agent/offerings/storage/`:

- `offering.json`
- `handlers.ts`

## Listing Steps (Roadmap)

1. Create agent: `acp agent create chronicle`
2. Initialize offering: `acp sell init chronicle-storage`
3. Copy `offering.json` from `agent/offerings/storage/`
4. Register: `acp sell create chronicle-storage`
5. Start runtime: `acp serve start`

## Offering Schema

```json
{
  "name": "chronicle-storage",
  "description": "Persistent storage service for AI agents. Store images, markdown, and JSON data on Arweave with optional encryption.",
  "fee": "0.01",
  "requirements": {
    "type": "object",
    "properties": {
      "data": { "type": "string" },
      "type": { "type": "string", "enum": ["image", "markdown", "json"] },
      "encrypted": { "type": "boolean" },
      "cipherIv": { "type": "string" }
    },
    "required": ["data", "type"]
  }
}
```
