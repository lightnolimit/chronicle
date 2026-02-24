import type { Document, UploadedDoc } from '../../types/index.js';

interface DocumentsWindowProps {
  documents: Document[];
  uploads: UploadedDoc[];
  onOpenDocument: (doc: Document) => void;
  onDeleteDocument: (id: string, name: string) => void;
  onHideUpload?: (id: string) => void;
  showHidden?: boolean;
  hiddenUploads?: UploadedDoc[];
}

export function DocumentsWindow({
  documents,
  uploads,
  onOpenDocument,
  onDeleteDocument,
  onHideUpload,
  showHidden,
  hiddenUploads,
}: DocumentsWindowProps) {
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