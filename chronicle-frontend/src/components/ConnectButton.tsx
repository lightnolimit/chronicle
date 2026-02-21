import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import './ConnectButton.css';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
    setShowDropdown(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainIcon = () => {
    if (!chain) return '◉';
    if (chain.id === 8453 || chain.id === 1) return '⬡'; // Base or Ethereum
    return '◎'; // Solana
  };

  if (isConnected && address) {
    return (
      <motion.button
        className="connect-button connected"
        onClick={() => disconnect()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="wallet-icon">{getChainIcon()}</span>
        {formatAddress(address)}
      </motion.button>
    );
  }

  return (
    <div className="connect-wrapper">
      <motion.button
        className="connect-button"
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Connect Wallet
      </motion.button>
      
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="wallet-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                className="wallet-option"
                onClick={() => handleConnect(connector)}
              >
                <span className="wallet-option-icon">
                  {connector.name.toLowerCase().includes('phantom') ? '👻' : 
                   connector.name.toLowerCase().includes('metamask') ? '🦊' : '💳'}
                </span>
                {connector.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}