import type { TrashItem } from '../../types/index.js';

interface TrashWindowProps {
  trashItems?: TrashItem[];
  onEmptyTrash?: () => void;
  onOpenItem?: (item: TrashItem) => void;
}

export function TrashWindow({ trashItems, onEmptyTrash, onOpenItem }: TrashWindowProps) {
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
            <div 
              key={item.id} 
              className="trash-item"
              onClick={() => onOpenItem?.(item)}
              style={{ cursor: item.id === 'manifesto' ? 'pointer' : 'default' }}
            >
              <span className="trash-item-name">{item.name}</span>
              <span className="trash-item-type">{item.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}