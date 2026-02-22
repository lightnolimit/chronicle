import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zIndex: number;
}

interface DesktopIcon {
  id: string;
  label: string;
  icon: 'computer' | 'notepad' | 'trash' | 'documents';
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
      const timer = setTimeout(onComplete, 2000);
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
            <div className={`welcome_illustration ${isDarkMode ? 'dark-mode' : ''}`} />
            <span>Welcome to Chronicle</span>
          </div>
        </div>
      )}
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
    if (id === 8453) return { label: 'BASE', class: 'network-mainnet' };
    if (id === 84532) return { label: 'BASE-SEPOLIA', class: 'network-testnet' };
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
      label: '🍎', 
      items: [
        { label: 'About the Finder...', action: () => {} },
        { label: '────────────', disabled: true },
        { label: 'System 7', disabled: true },
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
        <span className="toolbar-sep" />
        <button className="toolbar-btn">Cut</button>
        <button className="toolbar-btn">Copy</button>
        <button className="toolbar-btn">Paste</button>
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
  onDeleteDocument: (id: string) => void;
  onHideUpload?: (id: string) => void;
  showHidden?: boolean;
  hiddenUploads?: UploadedDoc[];
  onLoadDocument?: (doc: Document) => void;
}) {
  const handleDelete = (docId: string, docName: string) => {
    if (confirm(`Are you sure you want to delete "${docName}"? This cannot be undone.`)) {
      onDeleteDocument(docId);
    }
  };

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
                  onClick={() => handleDelete(doc.id, doc.name)}
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
                    👁
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

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'success' | 'error';
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
        <div className="mac-icon">🍎</div>
        <div className="computer-title">Macintosh</div>
        <div className="computer-subtitle">System 7</div>
        <div className="computer-version">Version 7.1</div>
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

async function uploadToApi(
  data: string, 
  type: string,
  name: string,
  walletAddress: string
) {
  const processedData = await processImageUrls(data);
  
  const response = await axios.post(`${API_URL}/api/upload`, {
    data: processedData,
    type,
    name,
  }, {
    headers: {
      'Authorization': `Bearer ${walletAddress}:sig`,
    },
  });

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
    status: 'uploading' | 'success' | 'error';
    error?: string;
    result?: { id: string; url: string; priceUsd?: number };
  } | null>(null);
  
  const [windows, setWindows] = useState<WindowState[]>([
    { id: 'computer', title: 'Computer', x: 80, y: 40, width: 320, height: 260, visible: false, zIndex: 1 },
    { id: 'documents', title: 'Documents', x: 100, y: 50, width: 400, height: 320, visible: false, zIndex: 1 },
    { id: 'notepad', title: 'Notepad', x: 120, y: 60, width: 520, height: 380, visible: true, zIndex: 2 },
    { id: 'trash', title: 'Trash', x: 140, y: 80, width: 360, height: 280, visible: false, zIndex: 1 },
  ]);
  const [activeWindow, setActiveWindow] = useState<string | null>('notepad');
  const [highestZ, setHighestZ] = useState(2);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('chronicle-dark-mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [hiddenUploadIds, setHiddenUploadIds] = useState<string[]>(loadHiddenUploads);
  const [showHidden, setShowHidden] = useState(false);
  const [trash, setTrash] = useState<TrashItem[]>(loadTrash);

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

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const { address, chainId } = useAccount();
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

  const handleDeleteDocument = (id: string) => {
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
  };

  const handleEmptyTrash = () => {
    if (confirm('Are you sure you want to empty the Trash? This cannot be undone.')) {
      setTrash([]);
    }
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
        if (!prev || prev.status !== 'uploading') return prev;
        const newProgress = Math.min(prev.progress + Math.random() * 15, 90);
        return { ...prev, progress: Math.floor(newProgress) };
      });
    }, 200);

    try {
      const result = await uploadToApi(content, type, name, address);
      
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
          </Window>
        ))}
      </main>
    </div>
  );
}