import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from './ConnectButton';
import { useButterfly } from '../context/ButterflyContext';
import './UploadPanel.css';

type UploadType = 'image' | 'markdown' | 'json';

interface UploadResult {
  id: string;
  url: string;
}

const TURBO_UPLOAD_URL = 'https://upload.ardrive.io/v1/x402/data-item/unsigned';

export function UploadPanel() {
  const { isConnected, address } = useAccount();
  const { triggerFlutter } = useButterfly();
  
  const [activeTab, setActiveTab] = useState<UploadType>('markdown');
  const [data, setData] = useState('');
  const [encrypted, setEncrypted] = useState(false);
  const [cipherIv, setCipherIv] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getContentType = (): string => {
    switch (activeTab) {
      case 'image': return 'image/png';
      case 'markdown': return 'text/markdown';
      case 'json': return 'application/json';
      default: return 'application/octet-stream';
    }
  };

  const handleUpload = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!data.trim()) {
      setError('Please enter data to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Get pricing info for display (x402 handles payment)
      await fetch(`https://ardrive.net/price/${new TextEncoder().encode(data).length}`);

      const tags = [
        { name: 'Content-Type', value: getContentType() },
        { name: 'App-Name', value: 'CHRONICLE' },
        { name: 'App-Version', value: '1.0.0' },
        { name: 'Type', value: activeTab },
        { name: 'Service', value: 'CHRONICLE' },
      ];

      if (encrypted) {
        tags.push(
          { name: 'Encrypted', value: 'true' },
          { name: 'Cipher', value: 'AES-256-GCM' }
        );
        if (cipherIv) {
          tags.push({ name: 'Cipher-IV', value: cipherIv });
        }
      }

      const response = await fetch(TURBO_UPLOAD_URL, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': getContentType(),
          'x-data-item-tags': JSON.stringify(tags),
          'x402': 'true',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadResult = await response.json();
      
      setResult({
        id: uploadResult.id,
        url: `https://arweave.net/${uploadResult.id}`,
      });
      triggerFlutter();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const tabs: { id: UploadType; label: string; icon: string }[] = [
    { id: 'image', label: 'Image', icon: '◫' },
    { id: 'markdown', label: 'Markdown', icon: '☰' },
    { id: 'json', label: 'JSON', icon: '{ }' },
  ];

  return (
    <motion.div
      className="upload-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="panel-header">
        <h2 className="panel-title">CHRONICLE</h2>
        <p className="panel-subtitle">Permanent Storage for AI Agents</p>
      </div>

      {!isConnected ? (
        <div className="connect-prompt">
          <p>Connect your wallet to start storing data on Arweave</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'image' ? (
                  <div className="input-group">
                    <label>Image Data (Base64)</label>
                    <textarea
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="Paste base64 image data or data:image/... URL"
                      rows={6}
                    />
                  </div>
                ) : activeTab === 'markdown' ? (
                  <div className="input-group">
                    <label>Markdown Content</label>
                    <textarea
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="# My Journal Entry&#10;&#10;Today I learned about..."
                      rows={10}
                    />
                  </div>
                ) : (
                  <div className="input-group">
                    <label>JSON Data</label>
                    <textarea
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder='{"key": "value", "timestamp": 1234567890}'
                      rows={10}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={encrypted}
                  onChange={(e) => setEncrypted(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Encrypt with AES-256-GCM
              </label>
              
              {encrypted && (
                <motion.div
                  className="input-group"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label>Cipher IV (Base64)</label>
                  <input
                    type="text"
                    value={cipherIv}
                    onChange={(e) => setCipherIv(e.target.value)}
                    placeholder="Base64-encoded initialization vector"
                  />
                </motion.div>
              )}
            </div>

            <div className="price-info">
              <span className="price-label">Base Price:</span>
              <span className="price-value">$0.01 USDC</span>
              <span className="price-note">+ 10% markup over storage costs</span>
            </div>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="success-header">
                  <span className="success-icon">✓</span>
                  Upload Successful
                </div>
                <div className="result-details">
                  <div className="result-row">
                    <span>Transaction ID:</span>
                    <code>{result.id.slice(0, 20)}...</code>
                  </div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-link"
                  >
                    View on Arweave →
                  </a>
                </div>
              </motion.div>
            )}

            <motion.button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading || !data.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {uploading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="upload-icon">↑</span>
                  Upload to Arweave
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}