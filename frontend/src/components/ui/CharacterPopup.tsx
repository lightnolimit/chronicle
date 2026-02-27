import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MessageBubble } from './MessageBubble.js';

interface CharacterPopupProps {
  isDarkMode: boolean;
  message?: string;
  onMessageComplete?: () => void;
  activeWindow?: string | null;
  currentDocument?: { name: string; content: string; type: string } | null;
  onAiRequest?: (endpoint: string, body: object) => Promise<any>;
  showTrashConfirm?: boolean;
  onTrashConfirmYes?: () => void;
  onTrashConfirmNo?: () => void;
}

interface PendingConfirmation {
  message: string;
  price: number;
  toolType: 'image' | 'video';
  originalPrompt: string;
}

export function CharacterPopup({
  isDarkMode,
  message: externalMessage,
  onMessageComplete,
  activeWindow,
  currentDocument,
  onAiRequest,
  showTrashConfirm,
  onTrashConfirmYes,
  onTrashConfirmNo,
}: CharacterPopupProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 610, y: window.innerHeight - 650 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [bubbleMessage, setBubbleMessage] = useState<string>('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [displayPrice, setDisplayPrice] = useState(0.01);
  const [isRouletteAnimating, setIsRouletteAnimating] = useState(false);
  
  const { address } = useAccount();

  const activeMessage = bubbleMessage || externalMessage || '';

  const dismissBubble = () => {
    setBubbleMessage('');
    onMessageComplete?.();
  };

  const getContextInfo = () => {
    if (!activeWindow) return '';
    const doc = currentDocument;
    if (activeWindow === 'notepad' && doc) {
      return `\n\n[Current document: "${doc.name}" (${doc.type})\nContent:\n${doc.content.substring(0, 1000)}]`;
    }
    return `\n\n[Active window: ${activeWindow}]`;
  };

  const playCoinSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.05);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  };

  const animatePrice = (targetPrice: number, direction: 'up' | 'down' = 'up') => {
    setIsRouletteAnimating(true);
    const startPrice = direction === 'up' ? 1 : targetPrice * 100;
    const endPrice = direction === 'up' ? targetPrice * 100 : 1;
    const step = direction === 'up' ? 1 : -1;
    let current = startPrice;
    
    const interval = setInterval(() => {
      current += step;
      setDisplayPrice(current / 100);
      playCoinSound();
      if ((direction === 'up' && current >= endPrice) || (direction === 'down' && current <= endPrice)) {
        clearInterval(interval);
        setIsRouletteAnimating(false);
        setDisplayPrice(0.01);
      }
    }, 250);
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !address || !onAiRequest) return;
    
    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    const contextInfo = getContextInfo();

    try {
      const response = await onAiRequest('/api/ai/agent', {
        prompt: userMessage + contextInfo,
      });
      
      const { text, toolNeeded, price } = response || {};
      
      if (toolNeeded && price && price > 0.01) {
        animatePrice(price);
        setPendingConfirmation({
          message: text || `This will cost ${price}¢. Would you like to proceed?`,
          price,
          toolType: toolNeeded,
          originalPrompt: userMessage + contextInfo,
        });
        setBubbleMessage(text || `This will cost ${price}¢. Would you like to proceed?`);
      } else {
        const assistantMessage = text || 'No response';
        setAiMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        setBubbleMessage(assistantMessage);
        setDisplayPrice(0.01);
      }
    } catch (error: any) {
      const errorMessage = `Error: ${error.response?.status || 'payment failed'} - ${error.message}`;
      setAiMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      setBubbleMessage(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  const handleYesConfirm = async () => {
    if (!pendingConfirmation || !onAiRequest || !address) return;
    
    const currentPrice = pendingConfirmation.price;
    setPendingConfirmation(null);
    setAiLoading(true);
    animatePrice(currentPrice, 'down');

    try {
      const response = await onAiRequest('/api/ai/execute', {
        toolType: pendingConfirmation.toolType,
        prompt: pendingConfirmation.originalPrompt,
      });
      
      const assistantMessage = response?.text || 'Generation complete!';
      setAiMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      setBubbleMessage(assistantMessage);
    } catch (error: any) {
      const errorMessage = `Error: ${error.response?.status || 'payment failed'} - ${error.message}`;
      setAiMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      setBubbleMessage(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  const handleNoConfirm = () => {
    if (!pendingConfirmation) return;
    const currentPrice = pendingConfirmation.price;
    setPendingConfirmation(null);
    animatePrice(currentPrice, 'down');
    setTimeout(() => {
      setBubbleMessage('Cancelled');
    }, 250);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 200));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 200));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      className="character-popup"
      style={{
        left: pos.x,
        top: pos.y,
        width: 400,
        height: 480,
      }}
    >
      <div 
        className="character-popup-header"
        onMouseDown={handleMouseDown}
      >
        <button 
          onClick={() => setShowChat(!showChat)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '10px',
            marginLeft: '8px',
            color: showChat ? '#007bff' : '#888',
          }}
          title={showChat ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          {showChat ? '◉' : '○'}
        </button>
        <div className="window-bars">
          <hr /><hr /><hr /><hr /><hr /><hr />
        </div>
        <span className="window-title">chronicle</span>
      </div>
      <div className="character-popup-body">
        <img 
          src="/chronicle-pfp-2.png" 
          alt="chronicle" 
          className="character-popup-image"
          style={{ width: 360, height: 340 }}
        />
        
        {showChat && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px', gap: '35px', padding: '0 8px 15px 8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '30px',
            flexShrink: 0,
          }}>
            <span style={{ 
              fontSize: '32px', 
              fontFamily: 'ChicagoFLF, sans-serif',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
            }}>
              {isRouletteAnimating ? `${displayPrice.toFixed(2)}¢` : `${(displayPrice * 100).toFixed(0)}¢`}
            </span>
          </div>
          <div style={{ width: '265px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(() => {
              const lastUserMessage = aiMessages.filter(m => m.role === 'user').at(-1);
              if (lastUserMessage) {
                return (
                  <div style={{ 
                    padding: '6px',
                    background: 'var(--hover-bg)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.3',
                    fontSize: '12px',
                    fontFamily: 'Geneva, sans-serif',
                    color: 'var(--hover-text)',
                  }}>
                    You: {lastUserMessage.content}
                  </div>
                );
              }
              return (
                <div style={{ 
                  padding: '6px',
                  background: 'var(--hover-bg)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.3',
                  fontSize: '12px',
                  fontFamily: 'Geneva, sans-serif',
                  color: '#666',
                  fontStyle: 'italic',
                }}>
                  what are you waiting for?
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); }}
                placeholder="Chat with chronicle..."
                style={{ 
                  flex: 1, 
                  padding: '6px', 
                  fontSize: '12px',
                  fontFamily: 'Geneva, sans-serif',
                }}
              />
              <button 
                onClick={handleAiSubmit}
                disabled={!address || !aiInput.trim() || aiLoading}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '12px',
                  fontFamily: 'ChicagoFLF, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      {(activeMessage || aiLoading) && (
        <MessageBubble 
          message={activeMessage || 'thinking'} 
          onComplete={dismissBubble}
          isDarkMode={isDarkMode}
          maxWidth={380}
          showConfirm={!!pendingConfirmation || showTrashConfirm}
          showThinking={aiLoading && !pendingConfirmation && !activeMessage && !showTrashConfirm}
          onYes={showTrashConfirm ? onTrashConfirmYes : handleYesConfirm}
          onNo={showTrashConfirm ? onTrashConfirmNo : handleNoConfirm}
        />
      )}
    </div>
  );
}
