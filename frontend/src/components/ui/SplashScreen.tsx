export function SplashScreen({ onComplete, isDarkMode }: { onComplete: () => void; isDarkMode: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      cursor: 'pointer',
    }} onClick={onComplete}>
      <img 
        src="/chronicle-pfp-2.png" 
        alt="chronicle" 
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <h1 style={{
        fontFamily: 'ChicagoFLF, sans-serif',
        fontSize: '48px',
        color: isDarkMode ? '#fff' : '#000',
        marginBottom: '10px',
      }}>
        chronicle
      </h1>
      <p style={{
        fontFamily: 'Geneva, sans-serif',
        fontSize: '14px',
        color: isDarkMode ? '#888' : '#666',
      }}>
        click to enter
      </p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}