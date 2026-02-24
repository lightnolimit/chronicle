import { useState, useEffect, useRef } from 'react';
import type { WindowState } from '../../types/index.js';

interface WindowProps {
  window: WindowState;
  onClose: () => void;
  onFocus: () => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  children: React.ReactNode;
  isActive: boolean;
}

export function Window({ window: win, onClose, onFocus, onMove, onResize, children, isActive }: WindowProps) {
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
      x: e.clientX - win.x,
      y: e.clientY - win.y,
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

  if (!win.visible) return null;

  return (
    <div
      ref={windowRef}
      className={`window ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header" onMouseDown={handleHeaderMouseDown}>
        <button 
          className="close-btn" 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute',
            left: '3%',
            top: '1px',
            border: '1px solid var(--black, black)',
            background: 'white',
            width: '12px',
            height: '12px',
            cursor: 'pointer',
          }}
        />
        <div className="window-bars">
          <hr /><hr /><hr /><hr /><hr /><hr />
        </div>
        <span className="window-title">{win.title}</span>
        {win.resizable !== false && (
          <button 
            className="minimize-btn"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '1px',
              border: '1px solid var(--black, black)',
              background: 'white',
              width: '12px',
              height: '12px',
              cursor: 'pointer',
            }}
          />
        )}
      </div>
      <div className="window-body">
        {children}
      </div>
      <div className="window-resize" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}