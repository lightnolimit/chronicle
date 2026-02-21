import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import ClockWallpaper from './components/ClockWallpaper';
import Butterflies from './components/Butterflies';
import { UploadPanel } from './components/UploadPanel';
import { MyUploads } from './components/MyUploads';
import { ConnectButton } from './components/ConnectButton';
import { ButterflyProvider } from './context/ButterflyContext';
import './App.css';

type Tab = 'upload' | 'uploads';

function App() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  return (
    <ButterflyProvider>
      <div className="app">
        <ClockWallpaper />
        <Butterflies />
        
        <header className="header">
          <motion.div
            className="logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="logo-text">CHRONICLE</span>
            <span className="logo-ticker">$CHRONICLE</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ConnectButton />
          </motion.div>
        </header>

        <main className="main">
          <motion.div
            className="hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="hero-title">
              <span className="hero-line">Time is</span>
              <span className="hero-line accent">Permanent</span>
            </h1>
            <p className="hero-subtitle">
              Store your AI agent's memories forever on Arweave
            </p>
          </motion.div>

          {isConnected && (
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload
              </button>
              <button
                className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
                onClick={() => setActiveTab('uploads')}
              >
                My Uploads
              </button>
            </div>
          )}

          {activeTab === 'upload' ? <UploadPanel /> : <MyUploads />}

          <motion.div
            className="features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="feature">
              <span className="feature-icon">⊕</span>
              <span className="feature-text">x402 Payments</span>
            </div>
            <div className="feature">
              <span className="feature-icon">◈</span>
              <span className="feature-text">AES-256-GCM</span>
            </div>
            <div className="feature">
              <span className="feature-icon">∞</span>
              <span className="feature-text">Permanent Storage</span>
            </div>
          </motion.div>
        </main>

        <footer className="footer">
          <span className="footer-text">Powered by</span>
          <span className="footer-link">Arweave + Turbo</span>
          <span className="footer-sep">•</span>
          <span className="footer-link">Virtuals Protocol</span>
        </footer>
      </div>
    </ButterflyProvider>
  );
}

export default App;