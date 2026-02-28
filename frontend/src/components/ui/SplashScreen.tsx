import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete, isDarkMode }: { onComplete: () => void; isDarkMode: boolean }) {
  const [phase, setPhase] = useState<'welcome' | 'done'>('welcome');

  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2500);

    return () => clearTimeout(welcomeTimer);
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
      backgroundImage: isDarkMode ? 'url(/pattern-dark.svg)' : 'url(/pattern-light.svg)',
      backgroundRepeat: 'repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div className="welcome" style={{
        background: '#ffffff',
        border: '2px solid #000000',
        width: '480px',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'welcomeFadeIn 1s ease-out forwards',
      }}>
        <style>{`
          @keyframes welcomeFadeIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <img 
          src="/chronicle-pfp-2.png" 
          alt="chronicle" 
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '0',
            marginBottom: '24px',
            marginTop: '40px',
          }}
        />
        <h1 style={{
          fontFamily: 'Borel, cursive',
          fontSize: '64px',
          color: '#000000',
          marginBottom: '0px',
          fontStyle: 'italic',
          transform: 'skewX(-2deg)',
        }}>
          chronicle
        </h1>
      </div>
    </div>
  );
}
