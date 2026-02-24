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
}

export function CharacterPopup({
  isDarkMode,
  message,
  onMessageComplete,
  activeWindow,
  currentDocument,
  onAiRequest,
}: CharacterPopupProps) {
  const [visible, setVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 260, y: window.innerHeight - 300 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const { address } = useAccount();

  const getContextInfo = () => {
    if (!activeWindow) return '';
    const doc = currentDocument;
    if (activeWindow === 'notepad' && doc) {
      return `\n\n[Current document: "${doc.name}" (${doc.type})\nContent:\n${doc.content.substring(0, 1000)}]`;
    }
    return `\n\n[Active window: ${activeWindow}]`;
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !address) return;
    
    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    const contextInfo = getContextInfo();

    try {
      let response: { text?: string } = {};
      if (onAiRequest) {
        response = await onAiRequest('/api/ai/text', {
          prompt: userMessage + contextInfo,
        });
      }
      setAiMessages(prev => [...prev, { role: 'assistant', content: response?.text || 'No response' }]);
    } catch (error: any) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `chronicle error: ${error.response?.status} ${error.message}` }]);
    } finally {
      setAiLoading(false);
    }
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

  if (!visible) return null;

  return (
    <div 
      className="character-popup"
      style={{
        left: pos.x,
        top: pos.y,
        width: 400,
        height: 520,
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
          style={{ width: 360, height: 360 }}
        />
        
        {showChat && (
        <div style={{ 
          border: '1px solid var(--border-light)', 
          marginTop: '8px',
          background: 'var(--bg-tertiary)',
          maxHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '6px',
            fontSize: '10px',
            fontFamily: 'Geneva, sans-serif',
          }}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ 
                marginBottom: '4px',
                padding: '4px',
                background: msg.role === 'user' ? 'var(--hover-bg)' : 'var(--bg-secondary)',
                borderRadius: '3px',
              }}>
                {msg.role === 'user' ? 'You: ' : 'chronicle: '}
                {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
              </div>
            ))}
            {aiLoading && <div style={{ color: 'var(--text-secondary)' }}>thinking...</div>}
          </div>
          <div style={{ display: 'flex', gap: '4px', padding: '4px', borderTop: '1px solid var(--border-light)' }}>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); }}
              placeholder="Chat with chronicle..."
              style={{ 
                flex: 1, 
                padding: '4px', 
                fontSize: '10px',
                fontFamily: 'Geneva, sans-serif',
              }}
            />
            <button 
              onClick={handleAiSubmit}
              disabled={!address || !aiInput.trim() || aiLoading}
              style={{ 
                padding: '2px 8px', 
                fontSize: '10px',
                fontFamily: 'ChicagoFLF, sans-serif',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
        )}
      </div>
      {message && (
        <MessageBubble 
          message={message} 
          onComplete={onMessageComplete}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}