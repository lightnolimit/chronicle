import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useDisconnect, useSignTypedData } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const USDC_CONTRACTS: Record<number, `0x${string}`> = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

const EIP3009_DOMAIN = {
  name: 'USD Coin',
  version: '2',
};

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};

interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zIndex: number;
  resizable?: boolean;
}

interface DesktopIcon {
  id: string;
  label: string;
  icon: 'computer' | 'notepad' | 'trash' | 'documents' | 'paint' | 'docs' | 'video';
  windowId: string;
}

interface Document {
  id: string;
  name: string;
  content: string;
  type: 'markdown' | 'json';
  createdAt: number;
  updatedAt: number;
}

interface UploadedDoc {
  id: string;
  type: string;
  url: string;
  name: string;
  timestamp: number;
  walletAddress?: string;
}

const ICONS: DesktopIcon[] = [
  { id: 'computer', label: 'Computer', icon: 'computer', windowId: 'computer' },
  { id: 'documents', label: 'Documents', icon: 'documents', windowId: 'documents' },
  { id: 'notepad', label: 'Notepad', icon: 'notepad', windowId: 'notepad' },
  { id: 'paint', label: 'Paint', icon: 'paint', windowId: 'paint' },
  { id: 'video', label: 'Video', icon: 'video', windowId: 'video' },
  { id: 'docs', label: 'Docs', icon: 'docs', windowId: 'docs' },
  { id: 'trash', label: 'Trash', icon: 'trash', windowId: 'trash' },
];

function loadDocuments(): Document[] {
  try {
    const saved = localStorage.getItem('chronicle-documents');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveDocuments(docs: Document[]) {
  localStorage.setItem('chronicle-documents', JSON.stringify(docs));
}

function loadUploads(): UploadedDoc[] {
  try {
    const saved = localStorage.getItem('chronicle-uploads');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveUploads(uploads: UploadedDoc[]) {
  localStorage.setItem('chronicle-uploads', JSON.stringify(uploads));
}

function loadHiddenUploads(): string[] {
  try {
    const saved = localStorage.getItem('chronicle-hidden-uploads');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHiddenUploads(hiddenIds: string[]) {
  localStorage.setItem('chronicle-hidden-uploads', JSON.stringify(hiddenIds));
}

interface TrashItem {
  id: string;
  name: string;
  type: string;
  timestamp: number;
}

function loadTrash(): TrashItem[] {
  try {
    const saved = localStorage.getItem('chronicle-trash');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveTrash(items: TrashItem[]) {
  localStorage.setItem('chronicle-trash', JSON.stringify(items));
}

function SplashScreen({ onComplete, isDarkMode }: { onComplete: () => void; isDarkMode: boolean }) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, onComplete]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div className="splash_screen">
      {!showWelcome ? (
        <div className="mac_loader" />
      ) : (
        <div className="welcome">
          <div className="welcome_screen">
            <img src="/chronicle-pfp.png" alt="chronicle" className="welcome_character" />
            <span className="welcome-title">chronicle</span>
            <span className="welcome-tagline">Permanent memory for AI agents and humans</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterPopup({ isDarkMode, message, onMessageComplete }: { isDarkMode: boolean; message?: string; onMessageComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 260, y: window.innerHeight - 300 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 440, height: 496 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const ASPECT_RATIO = 160 / 180;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 200));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 200));
        setPos({ x: newX, y: newY });
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const newWidth = Math.max(120, resizeStart.width + deltaX);
        const newHeight = newWidth / ASPECT_RATIO;
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  if (!visible) return null;

  return (
    <div 
      className="character-popup"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div 
        className="character-popup-header"
        onMouseDown={handleMouseDown}
      >
        <button className="close-btn" onClick={() => setVisible(false)} />
        <button className="minimize-btn" onClick={() => setVisible(false)} />
        <div className="window-bars">
          <hr /><hr /><hr /><hr /><hr /><hr />
        </div>
        <span className="window-title">chronicle</span>
      </div>
      <div className="character-popup-body">
        <img 
          src="/chronicle-pfp.png" 
          alt="chronicle" 
          className="character-popup-image"
          style={{ width: size.width - 40, height: size.width - 40 }}
        />
        <div className="character-popup-text">
          <div className="character-name" style={{ fontSize: Math.max(12, size.width / 10) }}>chronicle</div>
        </div>
      </div>
      {message && (
        <MessageBubble 
          message={message} 
          onComplete={onMessageComplete}
          isDarkMode={isDarkMode}
        />
      )}
      <div 
        className="character-popup-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

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

function MessageBubble({ message, onComplete }: { message: string; onComplete?: () => void; isDarkMode?: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        playTypewriterSound();
        setCurrentIndex(prev => prev + 1);
      }, 50 + Math.random() * 50);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [currentIndex, message, onComplete]);

  return (
    <div className="message-bubble">
      <div className="message-bubble-content">
        {displayedText}
        <span className="message-cursor">|</span>
      </div>
    </div>
  );
}

function MenuBar({ onOpenWallet, isDarkMode, onToggleDark, showHidden, onToggleShowHidden, chainId }: { 
  onOpenWallet: () => void; 
  isDarkMode: boolean; 
  onToggleDark: () => void;
  showHidden?: boolean;
  onToggleShowHidden?: () => void;
  chainId?: number;
}) {
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const getNetworkLabel = (id?: number) => {
    if (!id) return null;
    if (id === 8453) return { label: 'BASE (MAINNET)', class: 'network-mainnet' };
    if (id === 84532) return { label: 'BASE (SEPOLIA)', class: 'network-testnet' };
    return { label: `NET-${id}`, class: 'network-unknown' };
  };

  const network = getNetworkLabel(chainId);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    setShowMenu(null);
    onOpenWallet();
  };

  const handleDisconnect = () => {
    setShowMenu(null);
    disconnect();
  };

  const handleToggleDark = () => {
    setShowMenu(null);
    onToggleDark();
  };

  const handleToggleShowHidden = () => {
    setShowMenu(null);
    onToggleShowHidden?.();
  };

  const menus = [
    { 
      id: 'apple', 
      label: <img src="/chronicle-pfp.png" alt="chronicle" className="menu-logo" />, 
      items: [
        { label: 'About chronicle...', action: () => {} },
        { label: '────────────', disabled: true },
        { label: 'Version 1.0.0', disabled: true },
      ]
    },
    { id: 'file', label: 'File', items: [
      { label: 'New Document', action: () => {} },
      { label: 'Open...', action: () => {} },
      { label: '────────────', disabled: true },
      { label: 'Close', action: () => {} },
    ]},
    { id: 'edit', label: 'Edit', items: [
      { label: 'Undo', action: () => {} },
      { label: 'Redo', action: () => {} },
      { label: '────────────', disabled: true },
      { label: 'Cut', action: () => {} },
      { label: 'Copy', action: () => {} },
      { label: 'Paste', action: () => {} },
      { label: 'Select All', action: () => {} },
    ]},
    { id: 'view', label: 'View', items: [
      { label: 'Clean Up', action: () => {} },
      { label: '────────────', disabled: true },
      { label: isDarkMode ? 'Light Mode' : 'Dark Mode', action: handleToggleDark },
      ...(onToggleShowHidden ? [
        { label: showHidden ? 'Hide Hidden Files' : 'Show Hidden Files', action: handleToggleShowHidden },
      ] : []),
      { label: '────────────', disabled: true },
      { label: 'Enter Full Screen', action: () => {} },
    ]},
    { id: 'wallet', label: (isConnected ? formatAddress(address!) : 'Wallet') + (network ? ` (${network.label})` : ''), items: [
      isConnected 
        ? { label: `Connected: ${formatAddress(address!)}`, disabled: true }
        : { label: 'Connect Wallet...', action: handleConnect },
      ...(isConnected ? [
        ...(network ? [{ label: network.label, disabled: true }] : []),
        { label: '────────────', disabled: true },
        { label: 'Disconnect', action: handleDisconnect },
      ] : []),
    ]},
  ];

  return (
    <header className="mac_bar">
      <ul className="menu">
        {menus.map(menu => (
          <li 
            key={menu.id}
            onMouseEnter={() => showMenu && setShowMenu(menu.id)}
            onClick={() => setShowMenu(showMenu === menu.id ? null : menu.id)}
          >
            <span className={showMenu === menu.id ? 'active' : ''}>{menu.label}</span>
            {showMenu === menu.id && (
              <ul className="dropdown">
                {menu.items.map((item, i) => (
                  <li 
                    key={i} 
                    className={item.disabled ? 'menu-title' : ''}
                    onClick={() => {
                      if (!item.disabled && item.action) item.action();
                      setShowMenu(null);
                    }}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </header>
  );
}

function DesktopIcon({ icon, label, onDoubleClick }: { icon: string; label: string; onDoubleClick: () => void }) {
  const icons = {
    computer: (
      <svg viewBox="0 0 37 46" fill="none">
        <rect x="1" y="0.5" width="35" height="39" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="5" y="4.5" width="27" height="20" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="3" y="39.5" width="31" height="6" fill="white" stroke="black" strokeWidth="1.5"/>
        <line x1="18.5" y1="31.5" x2="30.5" y2="31.5" stroke="black" />
      </svg>
    ),
    documents: (
      <svg viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6.59 47V29.75C6.59 28.65 7.48 27.75 8.59 27.75H37.94C39.05 27.75 39.94 28.65 39.94 29.75V47" stroke="black" strokeWidth="1.5"/>
        <rect x="23.5" y="4" width="5.88" height="8.79" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="10" y="12" width="26" height="3" fill="white" stroke="black" strokeWidth="1"/>
        <rect x="10" y="18" width="26" height="3" fill="white" stroke="black" strokeWidth="1"/>
        <rect x="10" y="24" width="20" height="3" fill="white" stroke="black" strokeWidth="1"/>
      </svg>
    ),
    notepad: (
      <svg viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6.59 47V29.75C6.59 28.65 7.48 27.75 8.59 27.75H37.94C39.05 27.75 39.94 28.65 39.94 29.75V47" stroke="black" strokeWidth="1.5"/>
        <rect x="23.5" y="4" width="5.88" height="8.79" rx="1.5" fill="white" stroke="black" strokeWidth="1.5"/>
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 32 46" fill="none">
        <rect x="12.5" y="0.5" width="8" height="2" fill="white" stroke="black"/>
        <rect x="0.5" y="2.5" width="31" height="3" fill="white" stroke="black"/>
        <path d="M1.5 5.4H30.5V44C30.5 44.8 29.83 45.5 29 45.5H3C2.17 45.5 1.5 44.8 1.5 44V5.4Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <path d="M6 9.8L6.9 10.7C7.28 11 7.5 11.6 7.5 12.1V39C7.5 39.7 7.16 40.4 6.59 40.7L6 41.1" stroke="black"/>
        <path d="M12 9.8L12.9 10.7C13.28 11 13.5 11.6 13.5 12.1V39C13.5 39.7 13.16 40.4 12.59 40.7L12 41.1" stroke="black"/>
        <path d="M18 9.8L18.9 10.7C19.28 11 19.5 11.6 19.5 12.1V39C19.5 39.7 19.16 40.4 18.59 40.7L18 41.1" stroke="black"/>
        <path d="M24 9.8L24.9 10.7C25.28 11 25.5 11.6 25.5 12.1V39C25.5 39.7 25.16 40.4 24.59 40.7L24 41.1" stroke="black"/>
      </svg>
    ),
    paint: (
      <svg viewBox="0 0 47 50" fill="none">
        <path d="M22.45 1L1.5 23.26L23.85 47L44.8 24.74L22.45 1Z" fill="white" stroke="black" strokeWidth="1.3"/>
        <path d="M34.33 22.77L41.31 30.19V39.1H38.52V37.61H28.04L26.64 36.13H25.25L21.06 31.68V30.19L22.45 28.71V27.23L26.64 22.77H34.33Z" fill="white" stroke="black"/>
        <rect x="41.31" y="29.45" width="4.19" height="11.87" fill="black"/>
        <rect x="25.25" y="29.45" width="4.19" height="1.48" fill="black"/>
      </svg>
    ),
    video: (
      <svg viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <rect x="8" y="12" width="24" height="18" fill="black" rx="1"/>
        <polygon points="18,16 18,30 30,21" fill="white"/>
      </svg>
    ),
    docs: (
      <svg viewBox="0 0 46 47" fill="none">
        <path d="M2.5 46.35H43.5C44.6 46.35 45.5 45.45 45.5 44.35V8.23C45.5 7.78 45.34 7.33 45.05 6.97L40.81 1.74C40.43 1.27 39.86 1 39.25 1H2.5C1.4 1 0.5 1.9 0.5 3V44.35C0.5 45.45 1.4 46.35 2.5 46.35Z" fill="white" stroke="black" strokeWidth="1.5"/>
        <circle cx="23" cy="20" r="8" fill="white" stroke="black" strokeWidth="1.5"/>
        <circle cx="23" cy="20" r="3" fill="black"/>
        <path d="M23 12V8M23 28V32M12 20H8M34 20H38" stroke="black" strokeWidth="1.5"/>
      </svg>
    ),
  };

  return (
    <figure className="desktop-icon" onDoubleClick={onDoubleClick}>
      {icons[icon as keyof typeof icons]}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function Window({ 
  window, 
  onClose, 
  onFocus,
  onMove,
  onResize,
  children,
  isActive 
}: { 
  window: WindowState; 
  onClose: () => void;
  onFocus: () => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  children: React.ReactNode;
  isActive: boolean;
}) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = () => {
    onFocus();
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    });
    onFocus();
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    onFocus();
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && onMove) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onMove(Math.max(0, newX), Math.max(0, newY));
      }
      if (isResizing && onResize && windowRef.current) {
        const newWidth = Math.max(200, e.clientX - windowRef.current.getBoundingClientRect().left);
        const newHeight = Math.max(150, e.clientY - windowRef.current.getBoundingClientRect().top);
        onResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, onMove, onResize]);

  if (!window.visible) return null;

  return (
    <div
      ref={windowRef}
      className={`window ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header" onMouseDown={handleHeaderMouseDown}>
        <button className="close-btn" onClick={onClose} />
        <div className="window-bars">
          <hr /><hr /><hr /><hr /><hr /><hr />
        </div>
        <span className="window-title">{window.title}</span>
        {window.resizable !== false && (
          <div className="window-header-buttons">
            <button className="minimize-btn" onClick={onClose} />
          </div>
        )}
      </div>
      <div className="window-body">
        {children}
      </div>
      <div className="window-resize" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}

function DocumentEditor({ 
  onSubmit, 
  onSave,
  currentDoc,
  onOpenWallet,
  isWalletConnected,
}: { 
  onSubmit: (content: string, type: string, name: string) => Promise<void>; 
  onSave: (name: string, content: string, type: 'markdown' | 'json') => void;
  documents?: Document[];
  onLoadDocument?: (doc: Document) => void;
  currentDoc: Document | null;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
}) {
  const [content, setContent] = useState(currentDoc?.content || '');
  const [docName, setDocName] = useState(currentDoc?.name || 'Untitled');
  const [docType, setDocType] = useState<'markdown' | 'json'>(currentDoc?.type || 'markdown');
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    if (currentDoc) {
      setContent(currentDoc.content);
      setDocName(currentDoc.name);
      setDocType(currentDoc.type);
    }
  }, [currentDoc]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const sizeBytes = new TextEncoder().encode(content).length;
      if (sizeBytes === 0) {
        setPrice(0);
        return;
      }
      const calculatedPrice = calculatePriceLocal(sizeBytes);
      setPrice(calculatedPrice);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [content]);

  const handleSave = () => {
    if (!docName.trim()) {
      setSaveStatus('Please enter a document name');
      return;
    }
    onSave(docName, content, docType);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!isWalletConnected) {
      onOpenWallet?.();
      return;
    }
    setUploading(true);
    try {
      await onSubmit(content, docType, docName);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div className="document-editor">
      <div className="editor-toolbar">
        <input
          type="text"
          className="doc-name-input"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          placeholder="Document name"
        />
        <span className="toolbar-sep" />
        <select 
          value={docType} 
          onChange={(e) => setDocType(e.target.value as 'markdown' | 'json')}
          className="doc-type-select"
        >
          <option value="markdown">Markdown</option>
          <option value="json">JSON</option>
        </select>
        <span className="toolbar-sep" />
        <button className="toolbar-btn" onClick={handleSave}>
          {saveStatus || 'Save'}
        </button>
      </div>
      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={docType === 'markdown' ? '# Start writing...\n\nYour thoughts here...' : '{\n  "key": "value"\n}'}
      />
      <div className="editor-footer">
        <span className="price-display">
          ${price !== null ? price.toFixed(2) : '0.01'} USD
        </span>
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={uploading || !content.trim()}
        >
          {uploading ? 'Submitting...' : 'Submit to Permaweb'}
        </button>
      </div>
    </div>
  );
}

function DocumentsWindow({ 
  documents, 
  uploads,
  onOpenDocument,
  onDeleteDocument,
  onHideUpload,
  showHidden,
  hiddenUploads,
}: { 
  documents: Document[];
  uploads: UploadedDoc[];
  onOpenDocument: (doc: Document) => void;
  onDeleteDocument: (id: string, name: string) => void;
  onHideUpload?: (id: string) => void;
  showHidden?: boolean;
  hiddenUploads?: UploadedDoc[];
}) {
  const visibleUploads = uploads.filter(u => !hiddenUploads?.some(h => h.id === u.id));

  return (
    <div className="documents-content">
      <div className="docs-section">
        <div className="docs-section-header">Saved Documents</div>
        {documents.length === 0 ? (
          <div className="docs-empty">No saved documents</div>
        ) : (
          <div className="docs-grid">
            {documents.map(doc => (
              <div key={doc.id} className="docs-item" onDoubleClick={() => onOpenDocument(doc)}>
                <div className="docs-item-icon">📄</div>
                <div className="docs-item-name">{doc.name}</div>
                <div className="docs-item-type">{doc.type}</div>
                <button 
                  className="docs-delete-btn"
                  onClick={() => onDeleteDocument(doc.id, doc.name)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="docs-section">
        <div className="docs-section-header">Permaweb Uploads</div>
        {visibleUploads.length === 0 ? (
          <div className="docs-empty">No uploads yet</div>
        ) : (
          <div className="docs-grid">
            {visibleUploads.map(upload => (
              <div key={upload.id} className="docs-item" onClick={() => window.open(upload.url, '_blank')}>
                <div className="docs-item-icon">🌐</div>
                <div className="docs-item-name">{upload.name}</div>
                <div className="docs-item-type">{upload.type}</div>
                {onHideUpload && (
                  <button 
                    className="docs-hide-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHideUpload(upload.id);
                    }}
                    title="Hide from view"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showHidden && hiddenUploads && hiddenUploads.length > 0 && (
          <>
            <div className="docs-section-header" style={{ marginTop: '24px' }}>Hidden Uploads</div>
            <div className="docs-grid">
              {hiddenUploads.map(upload => (
                <div key={upload.id} className="docs-item" style={{ opacity: 0.6 }}>
                  <div className="docs-item-icon">🌐</div>
                  <div className="docs-item-name">{upload.name}</div>
                  <div className="docs-item-type">{upload.type}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TrashWindow({ 
  trashItems, 
  onEmptyTrash,
}: { 
  trashItems?: TrashItem[];
  onEmptyTrash?: () => void;
}) {
  return (
    <div className="trash-content">
      {trashItems && trashItems.length > 0 && (
        <div style={{ padding: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px' }}>
          <button 
            onClick={onEmptyTrash}
            style={{ 
              fontFamily: 'ChicagoFLF', 
              fontSize: '11px', 
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            Empty Trash
          </button>
        </div>
      )}
      {!trashItems || trashItems.length === 0 ? (
        <div className="trash-empty">Trash is Empty</div>
      ) : (
        <div className="trash-grid">
          {trashItems.map(item => (
            <div key={item.id} className="trash-item">
              <span className="trash-item-name">{item.name}</span>
              <span className="trash-item-type">{item.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoWindow({
  onSubmit,
  onOpenWallet,
  isWalletConnected,
}: {
  onSubmit: (content: string, type: string, name: string) => Promise<void>;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
}) {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('untitled');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedImage(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!prompt || !uploadedImage) return;
    setGenerating(true);
    // TODO: Call API with payment - setGeneratedVideo will be used when connected
    setTimeout(() => {
      setGenerating(false);
      // For demo, show a placeholder video URL when ready
      setGeneratedVideo('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
    }, 1000);
  };

  const handleUpload = async () => {
    if (!generatedVideo) return;
    if (!isWalletConnected) {
      onOpenWallet?.();
      return;
    }
    setUploading(true);
    try {
      await onSubmit(generatedVideo, 'video', videoName);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'ChicagoFLF', fontSize: '11px' }}>
          Upload Image
        </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploadedImage && (
          <img 
            src={`data:image/png;base64,${uploadedImage}`} 
            alt="Preview" 
            style={{ maxWidth: '150px', maxHeight: '100px', marginTop: '8px' }} 
          />
        )}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontFamily: 'ChicagoFLF', fontSize: '11px' }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the motion you want..."
          style={{ 
            width: '100%', 
            height: '60px', 
            fontFamily: 'Geneva', 
            fontSize: '11px',
            padding: '4px',
          }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <button 
          onClick={handleGenerate}
          disabled={!prompt || !uploadedImage || generating}
          style={{
            padding: '6px 12px',
            fontFamily: 'ChicagoFLF',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
        <span style={{ fontFamily: 'ChicagoFLF', fontSize: '10px', color: '#666' }}>$0.10</span>
      </div>
      
      {generatedVideo && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#888' }}>
          <video src={generatedVideo} controls style={{ maxWidth: '100%', maxHeight: '200px' }} />
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
          placeholder="Video name..."
          style={{ padding: '4px', fontFamily: 'Geneva', fontSize: '11px', flex: 1 }}
        />
        <button 
          onClick={handleUpload}
          disabled={uploading || !generatedVideo}
          style={{
            padding: '4px 12px',
            fontFamily: 'ChicagoFLF',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {uploading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 280, y: 200 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, e.clientX - dragOffset.x);
      const newY = Math.max(0, e.clientY - dragOffset.y);
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
    <div className="confirm-dialog-overlay">
      <div 
        className="confirm-dialog-window"
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
        }}
      >
        <div className="window-header" onMouseDown={handleHeaderMouseDown}>
          <div className="window-bars">
            <hr /><hr /><hr /><hr /><hr /><hr />
          </div>
        </div>
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon">⚠</div>
          <div className="confirm-dialog-message">{message}</div>
          <div className="confirm-dialog-buttons">
            <button className="confirm-btn cancel" onClick={onCancel}>Cancel</button>
            <button className="confirm-btn confirm" onClick={onConfirm}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'awaiting_payment' | 'success' | 'error';
  error?: string;
  result?: {
    id: string;
    url: string;
    priceUsd?: number;
  };
  onClose: () => void;
}

function UploadProgress({ progress, status, error, result, onClose }: UploadProgressProps) {
  const progressBars = Array.from({ length: 10 }, (_, i) => i < Math.floor(progress / 10));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 200, y: 150 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, e.clientX - dragOffset.x);
      const newY = Math.max(0, e.clientY - dragOffset.y);
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
      className="upload-progress-overlay"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      <div 
        className="upload-progress-window"
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
        }}
      >
        <div className="window-header" onMouseDown={handleHeaderMouseDown}>
          <button className="close-btn" onClick={onClose} />
          <div className="window-bars">
            <hr /><hr /><hr /><hr /><hr /><hr />
          </div>
        </div>
        <div className="window-body">
          <div className="progress-content">
            {status === 'uploading' && (
              <>
                <div className="progress-bars">
                  {progressBars.map((filled, i) => (
                    <div 
                      key={i} 
                      className={`progress-bar ${filled ? 'filled' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <div className="progress-label">Uploading to Arweave via Turbo...</div>
                <div className="progress-percent">{progress}%</div>
              </>
            )}
            
            {status === 'awaiting_payment' && (
              <>
                <div className="progress-bars">
                  {progressBars.map((filled, i) => (
                    <div 
                      key={i} 
                      className={`progress-bar ${filled ? 'filled' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <div className="progress-label">Awaiting payment signature...</div>
                <div className="progress-percent">Please sign in your wallet</div>
              </>
            )}
            
            {status === 'success' && result && (
              <>
                <div className="progress-success-icon">✓</div>
                <div className="progress-success-label">Submitted to Permaweb!</div>
                <div className="progress-details">
                  <div className="progress-detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                      {result.id}
                    </span>
                  </div>
                  <div className="progress-detail-row">
                    <span className="detail-label">URL:</span>
                    <span className="detail-value" style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                      {result.url}
                    </span>
                  </div>
                  <div className="progress-detail-row">
                    <span className="detail-label">Cost:</span>
                    <span className="detail-value">${result.priceUsd?.toFixed(2) || '0.01'} USD</span>
                  </div>
                </div>
                <button className="progress-done-btn" onClick={onClose}>Done</button>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="progress-error-icon">✕</div>
                <div className="progress-error-label">Upload Failed</div>
                <div className="progress-error-message">{error}</div>
                <button className="progress-done-btn" onClick={onClose}>OK</button>
              </>
            )}
          </div>
        </div>
        <div className="window-resize" />
      </div>
    </div>
  );
}

function ComputerWindow() {
  return (
    <div className="computer-content">
      <div className="computer-info">
        <img src="/logo.svg" alt="Chronicle" className="computer-logo" />
        <div className="computer-title">Chronicle</div>
        <div className="computer-subtitle">Permanent Storage</div>
        <div className="computer-version">Version 1.0.0</div>
      </div>
    </div>
  );
}

function DocsWindow() {
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const { address } = useAccount();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || !address) return;
    
    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      // TODO: Add proper payment flow
      const response = await axios.post(`${API_URL}/api/ai/text`, {
        prompt: userMessage,
      }, {
        headers: { 'Authorization': `Bearer ${address}:sig` },
      });
      setAiMessages(prev => [...prev, { role: 'assistant', content: response.data.text }]);
    } catch (error: any) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}. Add CHUTES_API_KEY to your .env file.` }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="docs-window">
      <div className="docs-content">
        <div className="docs-section">
          <h2 className="docs-heading">What is Chronicle?</h2>
          <p className="docs-text">
            Chronicle is a permanent storage solution for AI agents and humans. 
            Built on Arweave via Turbo, it provides immutable, decentralized storage 
            for your documents, images, and data. Every upload is permanently 
            archived on the permaweb.
          </p>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Cost</h2>
          <p className="docs-text">
            Base cost: $0.01 USD per upload<br/>
            + 10% markup over Arweave/Turbo storage costs<br/>
            AI Text Generation: $0.01<br/>
            AI Image Generation: $0.05<br/>
            AI Video Generation: $0.10<br/>
            Payments handled via USDC on Base network (x402 micropayments)
          </p>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">How to Use</h2>
          <ol className="docs-list">
            <li>Connect your wallet (Base mainnet)</li>
            <li>Create documents in Notepad or open Paint to create images</li>
            <li>Use AI features in Docs, Paint, and Video apps</li>
            <li>Click "Upload to Permaweb" to permanently store your content</li>
            <li>Your data is now permanently archived and accessible via Arweave</li>
          </ol>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Best Uses</h2>
          <ul className="docs-list">
            <li>AI agent memory and context storage</li>
            <li>Important documents requiring permanent archival</li>
            <li>Digital art and images on the permaweb</li>
            <li>Cross-agent communication and shared knowledge</li>
            <li>Timestamped records and provenance</li>
          </ul>
        </div>
        
        <div className="docs-section">
          <h2 className="docs-heading">Technology</h2>
          <p className="docs-text">
            <strong>Arweave:</strong> Decentralized permanent storage<br/>
            <strong>Turbo:</strong> Seamless Arweave uploads with USDC<br/>
            <strong>x402:</strong> Micropayment protocol for access control<br/>
            <strong>Base:</strong> Ethereum L2 for payments<br/>
            <strong>Chutes.ai:</strong> AI generation
          </p>
        </div>

        <div style={{ border: '2px solid #000', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#fff', borderBottom: '2px solid #000' }}>
            <img src="/chronicle-pfp.png" alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
            <span style={{ fontFamily: 'ChicagoFLF', fontSize: '12px', fontWeight: 'bold' }}>Ask chronicle</span>
          </div>
          <div style={{ height: '150px', overflowY: 'auto', padding: '8px', background: '#ddd' }}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ 
                marginBottom: '8px', 
                padding: '6px', 
                borderRadius: '4px',
                fontFamily: 'Geneva', 
                fontSize: '11px',
                background: msg.role === 'user' ? '#666' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#000',
                marginLeft: msg.role === 'user' ? '20px' : '0',
                marginRight: msg.role === 'assistant' ? '20px' : '0',
              }}>
                {msg.role === 'assistant' && <img src="/chronicle-pfp.png" alt="" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} />}
                {msg.content}
              </div>
            ))}
            {aiLoading && <div style={{ textAlign: 'center', padding: '12px', fontFamily: 'ChicagoFLF', fontSize: '11px', color: '#666' }}>chronicle is thinking...</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '8px', background: '#fff', borderTop: '1px solid #ccc' }}>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); }}}
              placeholder="Ask chronicle anything..."
              rows={2}
              style={{ flex: 1, padding: '6px', fontFamily: 'Geneva', fontSize: '11px', resize: 'none' }}
            />
            <button 
              onClick={handleAiSubmit}
              disabled={!address || !aiInput.trim() || aiLoading}
              style={{ padding: '6px 12px', fontFamily: 'ChicagoFLF', fontSize: '11px', cursor: 'pointer' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaintWindow({ 
  onSubmit, 
  onOpenWallet, 
  isWalletConnected,
  isDarkMode,
}: { 
  onSubmit: (content: string, type: string, name: string) => Promise<void>;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
  isDarkMode: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [drawMode, setDrawMode] = useState<'pen' | 'eraser' | 'line' | 'spray'>('pen');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [imageName, setImageName] = useState('untitled');
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const calculatePrice = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const sizeBytes = new TextEncoder().encode(dataUrl).length;
    if (sizeBytes === 0) {
      setPrice(0);
      return;
    }
    const calculatedPrice = calculatePriceLocal(sizeBytes);
    setPrice(calculatedPrice);
  }, []);

  useEffect(() => {
    const timer = setTimeout(calculatePrice, 100);
    return () => clearTimeout(timer);
  }, [calculatePrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = isDarkMode ? '#2a2a2a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isDarkMode]);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    if (drawMode === 'line') {
      lineStartRef.current = { x, y };
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);

    ctx.strokeStyle = drawMode === 'eraser' 
      ? (isDarkMode ? '#2a2a2a' : '#ffffff') 
      : (isDarkMode ? '#e0e0e0' : '#000000');
    ctx.lineWidth = strokeWidth;

    if (drawMode === 'line' && lineStartRef.current && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      ctx.moveTo(lineStartRef.current.x, lineStartRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawMode === 'spray') {
      for (let i = 0; i < 20; i++) {
        const offsetX = (Math.random() - 0.5) * strokeWidth * 3;
        const offsetY = (Math.random() - 0.5) * strokeWidth * 3;
        ctx.fillStyle = isDarkMode ? '#e0e0e0' : '#000000';
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      setLastX(x);
      setLastY(y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lineStartRef.current = null;
    snapshotRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = isDarkMode ? '#2a2a2a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };


  const handleSubmit = async () => {
    if (!isWalletConnected) {
      onOpenWallet?.();
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setUploading(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await onSubmit(dataUrl, 'image', imageName);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div className="paint-container">
      <div className="paint-tools">
        <button 
          className={`paint-tool-btn ${drawMode === 'pen' ? 'active' : ''}`}
          onClick={() => setDrawMode('pen')}
          title="Pen"
        >
          <svg height="18" viewBox="0 0 35 31" fill="none">
            <path d="M13 6.47L23.2 6.84L29.47 13.17L27.49 15.13L26.44 14.07L19 21.44L16.96 21.37L15.97 22.35L9.86 22.13L8.81 21.08L8.76 19.04L7.72 17.98L7.57 11.87L13 6.47Z" fill="white" stroke="currentColor"/>
            <rect x="22.69" y="6.31" width="4.19" height="11.87" transform="rotate(-44.7 22.69 6.31)" fill="currentColor"/>
          </svg>
        </button>
        <button 
          className={`paint-tool-btn ${drawMode === 'eraser' ? 'active' : ''}`}
          onClick={() => setDrawMode('eraser')}
          title="Eraser"
        >
          <svg height="18" viewBox="0 0 47 34" fill="none">
            <rect x="1.5" y="22.5" width="23" height="11" stroke="currentColor" fill="white"/>
            <line x1="24.4" y1="22.4" x2="45.96" y2="0.83" stroke="currentColor"/>
            <line x1="22.7" y1="0.8" x2="46.2" y2="0.8" stroke="currentColor"/>
            <line x1="24.65" y1="33.65" x2="46" y2="12.29" stroke="currentColor"/>
            <line x1="1.35" y1="22.43" x2="23.13" y2="0.65" stroke="currentColor"/>
          </svg>
        </button>
        <button 
          className={`paint-tool-btn line-btn ${drawMode === 'line' ? 'active' : ''}`}
          onClick={() => setDrawMode('line')}
          title="Line"
        >
          <hr />
        </button>
        <button 
          className={`paint-tool-btn ${drawMode === 'spray' ? 'active' : ''}`}
          onClick={() => setDrawMode('spray')}
          title="Spray"
        >
          <svg width="16" viewBox="0 0 14 11" fill="currentColor">
            <rect x="2" y="0.89" width="1.32" height="1.32"/>
            <rect x="2" y="3.52" width="1.32" height="1.32"/>
            <rect x="4.64" y="2.2" width="1.32" height="1.32"/>
            <rect x="7.27" y="3.52" width="1.32" height="1.32"/>
            <rect x="9.91" y="2.2" width="1.32" height="1.32"/>
            <rect x="2" y="6.16" width="1.32" height="1.32"/>
            <rect x="4.64" y="4.84" width="1.32" height="1.32"/>
            <rect x="7.27" y="6.16" width="1.32" height="1.32"/>
            <rect x="9.91" y="4.84" width="1.32" height="1.32"/>
            <rect x="2" y="8.8" width="1.32" height="1.32"/>
            <rect x="4.64" y="7.48" width="1.32" height="1.32"/>
            <rect x="7.27" y="8.8" width="1.32" height="1.32"/>
            <rect x="9.91" y="7.48" width="1.32" height="1.32"/>
          </svg>
        </button>
        <button className="paint-tool-btn" onClick={clearCanvas} title="Clear">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12v8H2V4zm3-2h6v2H5V2z"/>
          </svg>
        </button>
      </div>
      
      <div className="paint-strokes">
        <div className="paint-stroke-label">Size</div>
        <button 
          className={`paint-stroke-btn solid-1 ${strokeWidth === 1 ? 'active' : ''}`}
          onClick={() => setStrokeWidth(1)}
        >
          <hr />
        </button>
        <button 
          className={`paint-stroke-btn solid-2 ${strokeWidth === 2 ? 'active' : ''}`}
          onClick={() => setStrokeWidth(2)}
        >
          <hr />
        </button>
        <button 
          className={`paint-stroke-btn solid-3 ${strokeWidth === 4 ? 'active' : ''}`}
          onClick={() => setStrokeWidth(4)}
        >
          <hr />
        </button>
        <button 
          className={`paint-stroke-btn solid-4 ${strokeWidth === 8 ? 'active' : ''}`}
          onClick={() => setStrokeWidth(8)}
        >
          <hr />
        </button>
      </div>
      
      <div className="paint-canvas-area">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="paint-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      
      <div className="paint-footer">
        <input
          type="text"
          className="paint-name-input"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          placeholder="Image name..."
        />
        <span className="paint-price-display">
          {price !== null ? `${(price / 1000000).toFixed(4)} USDC` : '—'}
        </span>
        <button 
          className="paint-submit-btn"
          disabled={uploading || !isWalletConnected}
          onClick={handleSubmit}
        >
          {uploading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

async function processImageUrls(content: string): Promise<string> {
  const imageUrlRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  const matches = [...content.matchAll(imageUrlRegex)];
  if (matches.length === 0) return content;

  let processedContent = content;
  
  for (const match of matches) {
    const altText = match[1];
    const url = match[2];
    
    if (url.startsWith('data:')) continue;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const dataUri = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      processedContent = processedContent.replace(match[0], `![${altText}](${dataUri})`);
    } catch (error) {
      console.warn('Failed to download image:', url, error);
    }
  }
  
  return processedContent;
}

function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

function buildPaymentHeader(
  signature: `0x${string}`,
  authorization: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: `0x${string}`;
  },
  accepted: any,
  network: string
): string {
  const payload = {
    x402Version: 2,
    scheme: 'exact',
    network,
    accepted,
    payload: {
      signature,
      authorization,
    },
    extensions: {},
  };
  return btoa(JSON.stringify(payload));
}

async function uploadToApi(
  data: string, 
  type: string,
  name: string,
  walletAddress: string,
  signTypedData: (args: any) => Promise<`0x${string}`>,
  chainId?: number
) {
  const processedData = await processImageUrls(data);
  
  const makeRequest = async (paymentHeader?: string) => {
    return axios.post(`${API_URL}/api/upload`, {
      data: processedData,
      type,
      name,
    }, {
      headers: {
        'Authorization': `Bearer ${walletAddress}:sig`,
        ...(paymentHeader && { 'PAYMENT-SIGNATURE': paymentHeader }),
      },
    });
  };

  let response;
  try {
    response = await makeRequest();
  } catch (error: any) {
    if (error.response?.status === 402) {
      const paymentRequired = error.response.headers['payment-required'];
      
      if (!paymentRequired) {
        throw new Error('Server returned 402 but no payment requirements found');
      }
      
      try {
        const decoded = JSON.parse(atob(paymentRequired));
        
        if (decoded.accepts && decoded.accepts.length > 0) {
          const accepted = decoded.accepts[0];
          const amount = accepted.amount;
          const payTo = accepted.payTo;
          const network = accepted.network;
          const usdcAddress = USDC_CONTRACTS[chainId || 8453] || accepted.asset;
          
          const now = Math.floor(Date.now() / 1000);
          const validAfter = now.toString();
          const validBefore = (now + 300).toString();
          const nonce = generateNonce();
          
          const domain = {
            ...EIP3009_DOMAIN,
            chainId: chainId || 8453,
            verifyingContract: usdcAddress,
          };
          
          const message = {
            from: walletAddress as `0x${string}`,
            to: payTo as `0x${string}`,
            value: amount,
            validAfter,
            validBefore,
            nonce,
          };
          
          const signature = await signTypedData({
            domain,
            types: EIP3009_TYPES,
            primaryType: 'TransferWithAuthorization',
            message,
          });
          
          const authorization = {
            from: walletAddress as `0x${string}`,
            to: payTo as `0x${string}`,
            value: amount,
            validAfter,
            validBefore,
            nonce,
          };
          
          const paymentHeader = buildPaymentHeader(signature, authorization, accepted, network);
          response = await makeRequest(paymentHeader);
        } else {
          throw new Error('No payment requirements found');
        }
      } catch (payError: any) {
        if (payError.message?.includes('User rejected') || payError.code === 4001) {
          throw new Error('Payment signature rejected. Please approve the transaction in your wallet and try again.');
        }
        throw new Error(`Payment failed: ${payError.message}`);
      }
    } else {
      throw error;
    }
  }

  return {
    id: response.data.id,
    url: response.data.url,
  };
}

const MARKUP_PERCENT = 10;
const BASE_PRICE_USD = 0.01;

function calculatePriceLocal(sizeBytes: number): number {
  const turboCostPerByte = 0.000000001;
  const turboCost = sizeBytes * turboCostPerByte;
  const userPrice = Math.max(BASE_PRICE_USD, turboCost * (1 + MARKUP_PERCENT / 100));
  return Math.round(userPrice * 100) / 100;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [documents, setDocuments] = useState<Document[]>(loadDocuments);
  const [uploads, setUploads] = useState<UploadedDoc[]>(loadUploads);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    progress: number;
    status: 'uploading' | 'awaiting_payment' | 'success' | 'error';
    error?: string;
    result?: { id: string; url: string; priceUsd?: number };
  } | null>(null);
  
  const [windows, setWindows] = useState<WindowState[]>([
    { id: 'computer', title: 'Computer', x: 80, y: 40, width: 320, height: 260, visible: false, zIndex: 1 },
    { id: 'documents', title: 'Documents', x: 100, y: 50, width: 400, height: 320, visible: false, zIndex: 1 },
    { id: 'notepad', title: 'Notepad', x: 120, y: 60, width: 520, height: 380, visible: true, zIndex: 2 },
    { id: 'paint', title: 'Paint', x: 60, y: 30, width: 500, height: 420, visible: false, zIndex: 1 },
    { id: 'docs', title: 'Docs', x: 90, y: 50, width: 480, height: 400, visible: false, zIndex: 1 },
    { id: 'trash', title: 'Trash', x: 140, y: 80, width: 360, height: 280, visible: false, zIndex: 1 },
    { id: 'video', title: 'Video', x: 100, y: 60, width: 500, height: 420, visible: false, zIndex: 1 },
  ]);
  const [activeWindow, setActiveWindow] = useState<string | null>('notepad');
  const [highestZ, setHighestZ] = useState(2);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('chronicle-dark-mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [hiddenUploadIds, setHiddenUploadIds] = useState<string[]>(loadHiddenUploads);
  const [showHidden, setShowHidden] = useState(false);
  const [characterMessage, setCharacterMessage] = useState<string>('');
  const [trash, setTrash] = useState<TrashItem[]>(loadTrash);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    saveHiddenUploads(hiddenUploadIds);
  }, [hiddenUploadIds]);

  useEffect(() => {
    saveTrash(trash);
  }, [trash]);

  const handleHideUpload = (id: string) => {
    setHiddenUploadIds(prev => [...prev, id]);
  };

  const toggleShowHidden = () => {
    setShowHidden(prev => !prev);
  };

  const hiddenUploads = uploads.filter(u => hiddenUploadIds.includes(u.id));

  useEffect(() => {
    localStorage.setItem('chronicle-dark-mode', String(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!showSplash) {
      setWindows(ws => ws.map(w => 
        w.id === 'docs' ? { ...w, visible: true, zIndex: 100 } : w
      ));
      setActiveWindow('docs');
    }
  }, [showSplash]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const { address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { openConnectModal } = useConnectModal();

  const bringToFront = useCallback((id: string) => {
    setHighestZ(h => h + 1);
    setWindows(ws => ws.map(w => 
      w.id === id ? { ...w, zIndex: highestZ + 1 } : w
    ));
    setActiveWindow(id);
  }, [highestZ]);

  const toggleWindow = (id: string) => {
    const window = windows.find(w => w.id === id);
    if (window?.visible && activeWindow === id) {
      setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: false } : w));
    } else {
      setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: true } : w));
      bringToFront(id);
    }
  };

  const closeWindow = (id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: false } : w));
    if (activeWindow === id) {
      const visible = windows.filter(w => w.visible && w.id !== id);
      if (visible.length > 0) {
        setActiveWindow(visible[visible.length - 1].id);
      } else {
        setActiveWindow(null);
      }
    }
  };

  const moveWindow = (id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w));
  };

  const resizeWindow = (id: string, width: number, height: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, width, height } : w));
  };

  const handleSaveDocument = (name: string, content: string, type: 'markdown' | 'json') => {
    const existing = documents.find(d => d.name === name);
    if (existing) {
      const updated = documents.map(d => 
        d.id === existing.id 
          ? { ...d, content, type, updatedAt: Date.now() }
          : d
      );
      setDocuments(updated);
      saveDocuments(updated);
    } else {
      const newDoc: Document = {
        id: Math.random().toString(36).substring(2, 10),
        name,
        content,
        type,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...documents, newDoc];
      setDocuments(updated);
      saveDocuments(updated);
    }
  };

  const handleDeleteDocument = (id: string, name: string) => {
    setConfirmDialog({
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      onConfirm: () => {
        const doc = documents.find(d => d.id === id);
        if (doc) {
          const trashItem: TrashItem = {
            id: doc.id,
            name: doc.name,
            type: doc.type,
            timestamp: Date.now(),
          };
          setTrash(prev => [...prev, trashItem]);
        }
        const updated = documents.filter(d => d.id !== id);
        setDocuments(updated);
        saveDocuments(updated);
        setConfirmDialog(null);
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmDialog({
      message: 'Are you sure you want to empty the Trash? This cannot be undone.',
      onConfirm: () => {
        setTrash([]);
        setConfirmDialog(null);
      },
    });
  };

  const handleOpenDocument = (doc: Document) => {
    setCurrentDocument(doc);
    toggleWindow('notepad');
  };

  const handleSubmit = async (content: string, type: string, name: string) => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    setUploadProgress({ progress: 0, status: 'uploading' });
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev || (prev.status !== 'uploading' && prev.status !== 'awaiting_payment')) return prev;
        const newProgress = Math.min(prev.progress + Math.random() * 15, 90);
        return { ...prev, progress: Math.floor(newProgress) };
      });
    }, 200);

    try {
      setUploadProgress(prev => prev ? { ...prev, status: 'awaiting_payment' } : null);
      const result = await uploadToApi(content, type, name, address, signTypedDataAsync, chainId);
      
      clearInterval(progressInterval);
      setUploadProgress({ 
        progress: 100, 
        status: 'success',
        result: { id: result.id, url: result.url }
      });
      
      const newUpload: UploadedDoc = {
        id: result.id,
        type,
        url: result.url,
        name,
        timestamp: Date.now(),
        walletAddress: address,
      };
      
      const updatedUploads = [...uploads, newUpload];
      setUploads(updatedUploads);
      saveUploads(updatedUploads);
      
      const typeLabel = type === 'image' ? 'Image' : type === 'markdown' ? 'Document' : 'Data';
      setCharacterMessage(`${typeLabel} "${name}" saved to the permaweb!`);
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      setUploadProgress({ 
        progress: 0, 
        status: 'error',
        error: error.response?.data?.message || error.message || 'Upload failed'
      });
    }
  };

  const handleOpenWallet = () => {
    openConnectModal?.();
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="desktop">
      <MenuBar 
        onOpenWallet={handleOpenWallet} 
        isDarkMode={isDarkMode} 
        onToggleDark={toggleDarkMode}
        showHidden={showHidden}
        onToggleShowHidden={toggleShowHidden}
        chainId={chainId}
      />
      
      {uploadProgress && (
        <UploadProgress
          progress={uploadProgress.progress}
          status={uploadProgress.status}
          error={uploadProgress.error}
          result={uploadProgress.result}
          onClose={() => setUploadProgress(null)}
        />
      )}
      
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      
      {!showSplash && (
        <CharacterPopup 
          isDarkMode={isDarkMode} 
          message={characterMessage}
          onMessageComplete={() => setCharacterMessage('')}
        />
      )}
      
      <main className="desktop-main">
        <div className="desktop-icons">
          {ICONS.map(icon => (
            <DesktopIcon
              key={icon.id}
              icon={icon.icon}
              label={icon.label}
              onDoubleClick={() => toggleWindow(icon.windowId)}
            />
          ))}
        </div>

        {windows.map(window => (
          <Window
            key={window.id}
            window={window}
            onClose={() => closeWindow(window.id)}
            onFocus={() => bringToFront(window.id)}
            onMove={(x, y) => moveWindow(window.id, x, y)}
            onResize={(w, h) => resizeWindow(window.id, w, h)}
            isActive={activeWindow === window.id}
          >
            {window.id === 'notepad' && (
              <DocumentEditor 
                onSubmit={handleSubmit}
                onSave={handleSaveDocument}
                documents={documents}
                onLoadDocument={handleOpenDocument}
                currentDoc={currentDocument}
                onOpenWallet={handleOpenWallet}
                isWalletConnected={!!address}
              />
            )}
            {window.id === 'documents' && (
              <DocumentsWindow 
                documents={documents}
                uploads={uploads}
                onOpenDocument={handleOpenDocument}
                onDeleteDocument={handleDeleteDocument}
                onHideUpload={handleHideUpload}
                showHidden={showHidden}
                hiddenUploads={hiddenUploads}
              />
            )}
            {window.id === 'trash' && <TrashWindow trashItems={trash} onEmptyTrash={handleEmptyTrash} />}
            {window.id === 'computer' && <ComputerWindow />}
            {window.id === 'paint' && (
              <PaintWindow 
                onSubmit={handleSubmit}
                onOpenWallet={handleOpenWallet}
                isWalletConnected={!!address}
                isDarkMode={isDarkMode}
              />
            )}
            {window.id === 'docs' && <DocsWindow />}
            {window.id === 'video' && (
              <VideoWindow 
                onSubmit={handleSubmit}
                onOpenWallet={handleOpenWallet}
                isWalletConnected={!!address}
              />
            )}
          </Window>
        ))}
      </main>
    </div>
  );
}