import { createConfig, http } from '@wagmi/core';
import { baseSepolia, base } from 'wagmi/chains';

export const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: false,
});