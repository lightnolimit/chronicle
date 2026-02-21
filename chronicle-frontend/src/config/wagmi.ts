import { http, createConfig } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, mainnet],
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/qhKJDOmnBXZV26oQc9sKr'),
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/qhKJDOmnBXZV26oQc9sKr'),
  },
  connectors: [
    injected({
      target: 'phantom',
    }),
    injected(),
  ],
});

export const CHAIN_ID = base.id;