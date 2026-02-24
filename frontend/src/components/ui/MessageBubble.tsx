import { useEffect, useState } from 'react';

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

export function MessageBubble({ message, onComplete, isDarkMode = false }: { 
  message: string; 
  onComplete?: () => void;
  isDarkMode?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayed(message.slice(0, i + 1));
        playTypewriterSound();
        i++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [message, onComplete]);

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
      }}
    >
      {displayed}
      <span style={{ animation: 'blink 0.7s infinite' }}>|</span>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}