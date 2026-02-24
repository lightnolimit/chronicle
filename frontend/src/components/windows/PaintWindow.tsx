import { useState, useEffect, useRef, useCallback } from 'react';
import { calculatePrice, formatPrice } from '../../utils/pricing';

interface PaintWindowProps {
  onSubmit: (content: string, type: string, name: string) => Promise<void>;
  onOpenWallet?: () => void;
  isWalletConnected?: boolean;
  isDarkMode: boolean;
}

type DrawMode = 'pen' | 'eraser' | 'line' | 'spray';

export function PaintWindow({ onSubmit, onOpenWallet, isWalletConnected, isDarkMode }: PaintWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [drawMode, setDrawMode] = useState<DrawMode>('pen');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [imageName, setImageName] = useState('untitled');
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const calculatePriceFn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const sizeBytes = new TextEncoder().encode(dataUrl).length;
    if (sizeBytes === 0) {
      setPrice(0);
      return;
    }
    const calculatedPrice = calculatePrice(sizeBytes);
    setPrice(calculatedPrice);
  }, []);

  useEffect(() => {
    const timer = setTimeout(calculatePriceFn, 100);
    return () => clearTimeout(timer);
  }, [calculatePriceFn]);

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
          {formatPrice(price)}
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