import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MessageBubble } from './MessageBubble.js';

interface CharacterPopupProps {
  isDarkMode: boolean;
  visible?: boolean;
  onClose?: () => void;
  message?: string;
  onMessageComplete?: () => void;
  activeWindow?: string | null;
  currentDocument?: { name: string; content: string; type: string } | null;
  onAiRequest?: (endpoint: string, body: object) => Promise<any>;
}

interface PendingConfirmation {
  message: string;
  price: number;
  toolType: 'image' | 'video';
  originalPrompt: string;
}

export function CharacterPopup({
  isDarkMode,
  visible: controlledVisible,
  onClose,
  message: externalMessage,
  onMessageComplete,
  activeWindow,
  currentDocument,
  onAiRequest,
}: CharacterPopupProps) {
  const [internalVisible, setInternalVisible] = useState(true);
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;
  const setVisible = controlledVisible !== undefined 
    ? (v: boolean) => { if (!v) onClose?.(); } 
    : setInternalVisible;
  
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 260, y: window.innerHeight - 300 });
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

  const animatePrice = (targetPrice: number) => {
    setIsRouletteAnimating(true);
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      setDisplayPrice(current / 100);
      if (current >= targetPrice * 100) {
        clearInterval(interval);
        setIsRouletteAnimating(false);
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
    
    setPendingConfirmation(null);
    setAiLoading(true);

    try {
      const response = await onAiRequest('/api/ai/execute', {
        toolType: pendingConfirmation.toolType,
        prompt: pendingConfirmation.originalPrompt,
      });
      
      const assistantMessage = response?.text || 'Generation complete!';
      setAiMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      setBubbleMessage(assistantMessage);
      setDisplayPrice(0.01);
    } catch (error: any) {
      const errorMessage = `Error: ${error.response?.status || 'payment failed'} - ${error.message}`;
      setAiMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      setBubbleMessage(errorMessage);
      setDisplayPrice(0.01);
    } finally {
      setAiLoading(false);
    }
  };

  const handleNoConfirm = () => {
    setPendingConfirmation(null);
    setBubbleMessage('Cancelled');
    setDisplayPrice(0.01);
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

  if (!isVisible) return null;

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
        <button className="close-btn" onClick={() => setVisible(false)} />
        <button className="minimize-btn" onClick={() => setVisible(false)} />
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
          <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  color: 'var(--hover-text)',
                  fontStyle: 'italic',
                }}>
                  (waiting for something...?)
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
      {activeMessage && (
        <MessageBubble 
          message={activeMessage} 
          onComplete={dismissBubble}
          isDarkMode={isDarkMode}
          maxWidth={380}
          showConfirm={!!pendingConfirmation}
          onYes={handleYesConfirm}
          onNo={handleNoConfirm}
        />
      )}
    </div>
  );
}
