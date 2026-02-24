import type { ConfirmDialogProps } from '../../types/index.js';

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '2px solid var(--border-light)',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <p style={{ marginBottom: '20px', fontFamily: 'ChicagoFLF, sans-serif' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onConfirm}
            style={{
              padding: '8px 24px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'ChicagoFLF, sans-serif',
            }}
          >
            Delete
          </button>
          <button 
            onClick={onCancel}
            style={{
              padding: '8px 24px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'ChicagoFLF, sans-serif',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}