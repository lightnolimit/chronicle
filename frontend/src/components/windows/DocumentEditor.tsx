import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import type { Document } from '../../types/index.js';
import { API_URL } from '../../utils/constants.js';
import { fetchPrice, formatPrice } from '../../utils/pricing.js';

interface DocumentEditorProps {
  onSubmit: (content: string, type: string, name: string) => Promise<void>;
  onSave: (name: string, content: string, type: 'markdown' | 'json') => void;
  documents?: Document[];
  onLoadDocument?: (doc: Document) => void;
  currentDoc: Document | null;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
  readOnly?: boolean;
}

export function DocumentEditor({
  onSubmit,
  onSave,
  documents: _documents,
  onLoadDocument: _onLoadDocument,
  currentDoc,
  onOpenWallet,
  isWalletConnected,
  readOnly = false,
}: DocumentEditorProps) {
  const [content, setContent] = useState(currentDoc?.content || '');
  const [docName, setDocName] = useState(currentDoc?.name || 'Untitled');
  const [docType, setDocType] = useState<'markdown' | 'json'>(currentDoc?.type || 'markdown');
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [aiMode, setAiMode] = useState<'none' | 'summarize' | 'continue'>('none');
  const [aiLoading, setAiLoading] = useState(false);
  const { address } = useAccount();
  const priceRequestId = useRef(0);

  useEffect(() => {
    if (currentDoc) {
      setContent(currentDoc.content);
      setDocName(currentDoc.name);
      setDocType(currentDoc.type);
    }
  }, [currentDoc]);

  const handleAiAction = async () => {
    if (!content.trim() || !address) return;
    
    setAiLoading(true);
    let prompt = '';
    if (aiMode === 'summarize') {
      prompt = `Summarize the following text concisely:\n\n${content}`;
    } else if (aiMode === 'continue') {
      prompt = `Continue writing this text naturally:\n\n${content}`;
    }

    try {
      const response = await axios.post(`${API_URL}/api/ai/text`, { prompt }, {
        headers: { 'Authorization': `Bearer ${address}:sig` },
      });
      setContent(prev => prev + '\n\n' + response.data.text);
    } catch (error: any) {
      alert(`AI failed: ${error.message}`);
    } finally {
      setAiLoading(false);
      setAiMode('none');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const sizeBytes = new TextEncoder().encode(content).length;
      const requestId = ++priceRequestId.current;

      if (sizeBytes === 0) {
        setPrice(0);
        return;
      }

      const nextPrice = await fetchPrice(sizeBytes);
      if (priceRequestId.current === requestId) {
        setPrice(nextPrice);
      }
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
        <select 
          value={aiMode}
          onChange={(e) => setAiMode(e.target.value as typeof aiMode)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'ChicagoFLF, sans-serif',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          <option value="none">AI Actions...</option>
          <option value="summarize">Summarize</option>
          <option value="continue">Continue</option>
        </select>
        {aiMode !== 'none' && (
          <button 
            className="toolbar-btn" 
            onClick={handleAiAction}
            disabled={aiLoading || !content.trim()}
          >
            {aiLoading ? 'AI Working...' : `Apply AI ($${0.01.toFixed(2)})`}
          </button>
        )}
      </div>
      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => !readOnly && setContent(e.target.value)}
        placeholder={docType === 'markdown' ? '# Start writing...\n\nYour thoughts here...' : '{\n  "key": "value"\n}'}
        readOnly={readOnly}
        style={readOnly ? { background: 'var(--bg-secondary)', cursor: 'default' } : undefined}
      />
      <div className="editor-footer">
        <span className="price-display">
          {formatPrice(price)}
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
