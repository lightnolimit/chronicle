export function DesktopIcon({ icon, label, onDoubleClick }: { icon: string; label: string; onDoubleClick: () => void }) {
  const iconMap: Record<string, string> = {
    computer: '🖥️',
    notepad: '📝',
    trash: '🗑️',
    documents: '📁',
    paint: '🎨',
    docs: '📄',
    video: '🎬',
  };

  return (
    <div 
      onDoubleClick={onDoubleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '80px',
        padding: '8px',
        cursor: 'pointer',
        borderRadius: '4px',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: '32px', marginBottom: '4px' }}>{iconMap[icon] || '📁'}</span>
      <span style={{ 
        fontSize: '12px', 
        color: 'var(--text-primary)',
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}>
        {label}
      </span>
    </div>
  );
}