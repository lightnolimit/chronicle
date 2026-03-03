# Chronicle Roadmap

## Vision

Build a permanent storage solution for AI agents and humans, powered by Arweave, with seamless crypto payments via x402.

---

## Phase 1: Core Platform (Complete ✅)

- [x] Frontend UI (React + Vite)
- [x] Document editor (Notepad-style)
- [x] Image editor (Paint-style)
- [x] AI chat interface
- [x] Arweave storage via Turbo
- [x] x402 payment integration (USDC on Base)
- [x] Phala Cloud deployment
- [x] Cloudflare custom domains

---

## Phase 2: Payment Infrastructure (In Progress 🚧)

- [ ] Deploy smart contract payment receiver
  - Replaces EOA with audited smart contract
  - Eliminates MetaMask "untrusted EOA" warnings
  - Enables automatic fund distribution
- [ ] Verify contract on Basescan
- [ ] Multi-sig support for treasury

---

## Phase 3: Agent Features (Planned 📋)

- [ ] AI agent memory / context storage
- [ ] Agent-to-agent communication
- [ ] Programmable storage rules
- [ ] Webhook notifications

---

## Phase 4: Scale (Future 🚀)

- [ ] Multi-chain support (Polygon, Avalanche)
- [ ] Token-gated content
- [ ] Subscription plans
- [ ] Enterprise features

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| MetaMask "untrusted EOA" warning | Known | Users can proceed safely. Payment address is the agent's secure wallet. Fix planned for Phase 2. |
