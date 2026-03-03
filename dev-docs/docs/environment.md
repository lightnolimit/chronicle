# Environment Variables

This repo uses environment variables for the agent (API) and frontend. Below is the source of truth for what each variable does.

## Agent (agent/.env)

| Variable | Required | Description |
|---|---|---|
| `EVM_PRIVATE_KEY` | Yes | Wallet private key used by the agent to pay Turbo for uploads via x402. This is **server-side only** and must be kept secret. |
| `EVM_ADDRESS` | Yes | Address that receives x402 payments from users. This should be the public address that matches the intended receiving wallet. |
| `NETWORK` | Yes | `base` or `base-sepolia`. Controls CAIP-2 network used for x402 (`eip155:8453` or `eip155:84532`). |
| `PORT` | No | API server port. Defaults to `3001`. |
| `CHUTES_API_KEY` | No | Enables AI endpoints on mainnet. Required if you want `/api/ai/*` to work. |
| `ARWEAVE_JWK` | No | Optional Arweave JWK for direct Arweave wallet operations (not required for Turbo). |
| `TURBO_TOKEN` | No | Turbo token preference (default: `ethereum`, used by Turbo SDK). |
| `API_AUTH_HEADER` | No | Overrides the auth header name (default: `authorization`). |

## Frontend (frontend/.env)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL. Defaults to `http://localhost:3001` in development. |

## Notes

- `EVM_PRIVATE_KEY` is used only by the **agent** to pay Turbo; it is not shared with clients.
- `EVM_ADDRESS` is the destination for x402 payments from users.
- If `NETWORK=base`, AI endpoints are available only when `CHUTES_API_KEY` is set.
