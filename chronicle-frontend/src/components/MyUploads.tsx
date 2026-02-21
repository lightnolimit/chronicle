import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { motion } from 'framer-motion';
import './MyUploads.css';

interface Upload {
  id: string;
  url: string;
  type: string;
  encrypted: boolean;
  size_bytes: number;
  cost_usd: number;
  created_at: string;
}

interface ApiResponse {
  uploads: Upload[];
  total: number;
  limit: number;
  offset: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function MyUploads() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const getAuthHeader = async () => {
    if (!address) return '';
    const message = 'CHRONICLE auth';
    const signature = await signMessageAsync({ message });
    return `Bearer ${address}:${signature}`;
  };

  const fetchUploads = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const auth = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/uploads?limit=50`, {
        headers: {
          'Authorization': auth,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }
      
      const data: ApiResponse = await response.json();
      setUploads(data.uploads);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    if (!address) return;
    
    try {
      const auth = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/uploads/export?format=${format}`, {
        headers: {
          'Authorization': auth,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-uploads.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUploads();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      className="my-uploads"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="uploads-header">
        <h2>My Uploads</h2>
        <div className="uploads-actions">
          <button 
            className="export-btn"
            onClick={() => exportData('json')}
            disabled={loading || total === 0}
          >
            Export JSON
          </button>
          <button 
            className="export-btn"
            onClick={() => exportData('csv')}
            disabled={loading || total === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="uploads-error">{error}</div>
      )}

      {loading ? (
        <div className="uploads-loading">Loading...</div>
      ) : uploads.length === 0 ? (
        <div className="uploads-empty">
          <p>No uploads yet</p>
          <p className="empty-hint">Upload your first file to see it here</p>
        </div>
      ) : (
        <>
          <p className="uploads-count">{total} total uploads</p>
          <div className="uploads-list">
            {uploads.map((upload) => (
              <div key={upload.id} className="upload-item">
                <div className="upload-info">
                  <span className={`upload-type ${upload.type}`}>{upload.type}</span>
                  {upload.encrypted && <span className="upload-encrypted">🔒</span>}
                </div>
                <a 
                  href={upload.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="upload-url"
                >
                  {upload.id.slice(0, 20)}...
                </a>
                <div className="upload-meta">
                  <span>{(upload.size_bytes / 1024).toFixed(1)} KB</span>
                  <span>${upload.cost_usd.toFixed(3)}</span>
                  <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}