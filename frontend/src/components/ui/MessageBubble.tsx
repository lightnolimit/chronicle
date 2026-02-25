import { useEffect, useState, useRef } from 'react';

function playTypewriterSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800 + Math.random() * 400;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
}

interface MessageBubbleProps {
  message: string;
  onComplete?: () => void;
  isDarkMode?: boolean;
  lingerDuration?: number;
  maxWidth?: number;
  showConfirm?: boolean;
  onYes?: () => void;
  onNo?: () => void;
}

export function MessageBubble({ 
  message, 
  onComplete, 
  isDarkMode = false, 
  lingerDuration = 5000, 
  maxWidth = 380,
  showConfirm = false,
  onYes,
  onNo,
}: MessageBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const lingerTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showConfirm) {
      setDisplayed(message);
      setIsComplete(true);
      return;
    }
    
    setDisplayed('');
    setIsComplete(false);
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayed(message.slice(0, i + 1));
        playTypewriterSound();
        i++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [message, showConfirm]);

  useEffect(() => {
    if (isComplete && onComplete && !showConfirm) {
      lingerTimeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, lingerDuration);
    }
    
    return () => {
      if (lingerTimeoutRef.current) {
        clearTimeout(lingerTimeoutRef.current);
      }
    };
  }, [isComplete, onComplete, lingerDuration, showConfirm]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayed]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        padding: '8px 12px',
        background: isDarkMode ? '#333' : '#ffffff',
        color: isDarkMode ? '#fff' : '#000',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'ChicagoFLF, sans-serif',
        width: `${maxWidth}px`,
        maxWidth: `${maxWidth}px`,
        height: '50px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        border: '2px solid black',
        cursor: 'pointer',
        lineHeight: '1.4',
      }}
      onClick={() => !showConfirm && onComplete?.()}
      title="Click to dismiss"
    >
      <div style={{
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
      }}>
        {displayed}
        {!isComplete && !showConfirm && <span style={{ animation: 'blink 0.7s infinite' }}>|</span>}
      </div>
      {showConfirm && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onYes?.(); }}
            style={{
              padding: '4px 16px',
              fontSize: '11px',
              fontFamily: 'ChicagoFLF, sans-serif',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Yes
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNo?.(); }}
            style={{
              padding: '4px 16px',
              fontSize: '11px',
              fontFamily: 'ChicagoFLF, sans-serif',
              background: '#fff',
              color: '#000',
              border: '1px solid #000',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      )}
      {isComplete && !showConfirm && <span style={{ opacity: 0.5, fontSize: '10px' }}> (click)</span>}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
