import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import axios from 'axios';
import './index.css';

import { USDC_CONTRACTS, EIP3009_DOMAIN, EIP3009_TYPES, generateNonce } from './utils/payment';
import { ICONS, API_URL } from './utils/constants';
import type { TrashItem as TrashItemType, Document, UploadedDoc, WindowState } from './types/index';

import { 
  SplashScreen, 
  CharacterPopup,
  MenuBar,
  DesktopIcon,
  Window,
  ConfirmDialog,
  UploadProgress,
} from './components/ui/index.js';

import {
  DocumentEditor,
  DocumentsWindow,
  TrashWindow,
  ComputerWindow,
  DocsWindow,
  PaintWindow,
  VideoWindow,
} from './components/windows/index.js';

type TrashItem = TrashItemType;
import { 
  loadDocuments as loadDocs, 
  saveDocuments as saveDocs, 
  loadUploads as loadUps, 
  saveUploads as saveUps,
  loadHiddenUploads as loadHidden,
  saveHiddenUploads as saveHidden,
  loadTrash as loadT,
  saveTrash as saveT
} from './utils/storage';

const loadDocuments = loadDocs;
const saveDocuments = saveDocs;
const loadUploads = loadUps;
const saveUploads = saveUps;
const loadHiddenUploads = loadHidden;
const saveHiddenUploads = saveHidden;
const loadTrash = loadT;
const saveTrash = saveT;

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

async function callAiApi(
  endpoint: string,
  body: object,
  walletAddress: string,
  signTypedData: (args: any) => Promise<`0x${string}`>,
  chainId?: number
) {
  const makeRequest = async (paymentHeader?: string) => {
    return axios.post(`${API_URL}${endpoint}`, body, {
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

  return response.data;
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
  const [trashConfirmBubble, setTrashConfirmBubble] = useState(false);
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

  const minimizeWindow = (id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
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
    setTrashConfirmBubble(true);
    setCharacterMessage('Are you sure you want to empty the Trash? This cannot be undone.');
  };

  const handleTrashConfirmYes = () => {
    const manifesto = trash.find(item => item.id === 'manifesto');
    setTrash(manifesto ? [manifesto] : []);
    setTrashConfirmBubble(false);
    setCharacterMessage('Trash emptied');
  };

  const handleTrashConfirmNo = () => {
    setTrashConfirmBubble(false);
    setCharacterMessage('Cancelled');
  };

  const handleOpenDocument = (doc: Document) => {
    setCurrentDocument(doc);
    toggleWindow('notepad');
  };

  const handleOpenTrashItem = (item: TrashItem) => {
    if (item.id === 'manifesto' && item.content) {
      setCurrentDocument({ 
        id: 'manifesto',
        name: item.name, 
        content: item.content, 
        type: 'markdown',
        createdAt: item.created_at || Date.now(),
        updatedAt: Date.now(),
        readOnly: true 
      });
      toggleWindow('notepad');
    }
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
          activeWindow={activeWindow}
          currentDocument={currentDocument}
          onAiRequest={(endpoint, body) => callAiApi(endpoint, body, address!, signTypedDataAsync, chainId)}
          showTrashConfirm={trashConfirmBubble}
          onTrashConfirmYes={handleTrashConfirmYes}
          onTrashConfirmNo={handleTrashConfirmNo}
        />
      )}
      
      <main className="desktop-main">
        <div className="desktop-icons">
          <div className="desktop-icons-column">
            {ICONS.map(icon => (
              <DesktopIcon
                key={icon.id}
                icon={icon.icon}
                label={icon.label}
                onDoubleClick={() => toggleWindow(icon.windowId)}
              />
            ))}
          </div>
        </div>

        {windows.map(window => (
          <Window
            key={window.id}
            window={window}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
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
                readOnly={currentDocument?.readOnly}
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
            {window.id === 'trash' && <TrashWindow trashItems={trash} onEmptyTrash={handleEmptyTrash} onOpenItem={handleOpenTrashItem} />}
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