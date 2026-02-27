import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete, isDarkMode }: { onComplete: () => void; isDarkMode: boolean }) {
  const [phase, setPhase] = useState<'loading' | 'welcome' | 'done'>('loading');

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setPhase('welcome');
    }, 2000);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (phase === 'welcome') {
      const welcomeTimer = setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 2500);

      return () => clearTimeout(welcomeTimer);
    }
  }, [phase, onComplete]);

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
      {phase === 'loading' ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/chronicle-pfp-2.png" 
            alt="chronicle" 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              animation: 'macBounce 0.6s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes macBounce {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(0.95); }
            }
          `}</style>
        </div>
      ) : (
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
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              marginBottom: '24px',
            }}
          />
          <h1 style={{
            fontFamily: 'Borel, cursive',
            fontSize: '42px',
            color: '#000000',
            marginBottom: '8px',
            fontStyle: 'italic',
            transform: 'skewX(-2deg)',
          }}>
            chronicle
          </h1>
          <p style={{
            fontFamily: 'Geneva, sans-serif',
            fontSize: '14px',
            color: '#666666',
            fontStyle: 'italic',
          }}>
            Welcome to Macintosh
          </p>
        </div>
      )}
    </div>
  );
}
