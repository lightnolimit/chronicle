import type { UploadProgressProps } from '../../types/index.js';

export function UploadProgress({ progress, status, error, result, onClose }: UploadProgressProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-light)',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9998,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'ChicagoFLF, sans-serif' }}>Upload Status</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>x</button>
      </div>
      
      {status === 'uploading' && (
        <>
          <div style={{ 
            height: '8px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: '#007bff',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Uploading... {progress}%</span>
        </>
      )}
      
      {status === 'awaiting_payment' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>waiting for payment...</div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Please confirm payment in your wallet</span>
        </div>
      )}
      
      {status === 'success' && result && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', color: '#28a745' }}>Success!</div>
          <div style={{ fontSize: '12px', marginBottom: '8px' }}>Price: ${result.priceUsd?.toFixed(2)}</div>
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#007bff', wordBreak: 'break-all' }}
          >
            {result.url}
          </a>
        </div>
      )}
      
      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', color: '#dc3545' }}>Error</div>
          <div style={{ fontSize: '12px', color: '#dc3545' }}>{error}</div>
        </div>
      )}
    </div>
  );
}
