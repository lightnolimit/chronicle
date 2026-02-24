import { useState, useCallback } from 'react';
import type { WindowState } from '../types/index.js';

const DEFAULT_WINDOWS: WindowState[] = [
  { id: 'computer', title: 'Computer', x: 80, y: 40, width: 320, height: 260, visible: false, zIndex: 1 },
  { id: 'documents', title: 'Documents', x: 100, y: 50, width: 400, height: 320, visible: false, zIndex: 1 },
  { id: 'notepad', title: 'Notepad', x: 120, y: 60, width: 520, height: 380, visible: true, zIndex: 2 },
  { id: 'paint', title: 'Paint', x: 60, y: 30, width: 500, height: 420, visible: false, zIndex: 1 },
  { id: 'docs', title: 'Docs', x: 90, y: 50, width: 480, height: 400, visible: false, zIndex: 1 },
  { id: 'trash', title: 'Trash', x: 140, y: 80, width: 360, height: 280, visible: false, zIndex: 1 },
  { id: 'video', title: 'Video', x: 100, y: 60, width: 500, height: 420, visible: false, zIndex: 1 },
];

export function useWindows() {
  const [windows, setWindows] = useState<WindowState[]>(DEFAULT_WINDOWS);
  const [activeWindow, setActiveWindow] = useState<string | null>('notepad');
  const [highestZ, setHighestZ] = useState(2);

  const bringToFront = useCallback((id: string) => {
    setHighestZ(h => h + 1);
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: highestZ + 1 } : w));
    setActiveWindow(id);
  }, [highestZ]);

  const toggleWindow = useCallback((id: string) => {
    const window = windows.find(w => w.id === id);
    if (window?.visible && activeWindow === id) {
      setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: false } : w));
    } else {
      setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: true } : w));
      bringToFront(id);
    }
  }, [windows, activeWindow, bringToFront]);

  const closeWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: false } : w));
    if (activeWindow === id) {
      const visible = windows.filter(w => w.visible && w.id !== id);
      if (visible.length > 0) {
        setActiveWindow(visible[visible.length - 1].id);
      } else {
        setActiveWindow(null);
      }
    }
  }, [activeWindow, windows]);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  const openWindow = useCallback((id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, visible: true } : w));
    bringToFront(id);
  }, [bringToFront]);

  return {
    windows,
    setWindows,
    activeWindow,
    setActiveWindow,
    highestZ,
    bringToFront,
    toggleWindow,
    closeWindow,
    moveWindow,
    resizeWindow,
    openWindow,
  };
}