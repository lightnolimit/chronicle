import type { DesktopIcon } from '../types/index.js';

export const ICONS: DesktopIcon[] = [
  { id: 'computer', label: 'Computer', icon: 'computer', windowId: 'computer' },
  { id: 'documents', label: 'Documents', icon: 'documents', windowId: 'documents' },
  { id: 'notepad', label: 'Notepad', icon: 'notepad', windowId: 'notepad' },
  { id: 'paint', label: 'Paint', icon: 'paint', windowId: 'paint' },
  { id: 'video', label: 'Video', icon: 'video', windowId: 'video' },
  { id: 'docs', label: 'Docs', icon: 'docs', windowId: 'docs' },
  { id: 'trash', label: 'Trash', icon: 'trash', windowId: 'trash' },
];

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';