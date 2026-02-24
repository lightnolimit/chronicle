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
}

export function MessageBubble({ message, onComplete, isDarkMode = false, lingerDuration = 5000 }: MessageBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const lingerTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
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
  }, [message]);

  useEffect(() => {
    if (isComplete && onComplete) {
      lingerTimeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, lingerDuration);
    }
    
    return () => {
      if (lingerTimeoutRef.current) {
        clearTimeout(lingerTimeoutRef.current);
      }
    };
  }, [isComplete, onComplete, lingerDuration]);

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        padding: '8px 12px',
        background: isDarkMode ? '#333' : '#f0f0f0',
        color: isDarkMode ? '#fff' : '#000',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'Geneva, sans-serif',
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        border: '2px solid black',
        cursor: 'pointer',
      }}
      onClick={() => onComplete?.()}
      title="Click to dismiss"
    >
      {displayed}
      {isComplete && <span style={{ opacity: 0.5 }}> (click to dismiss)</span>}
      {!isComplete && <span style={{ animation: 'blink 0.7s infinite' }}>|</span>}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}