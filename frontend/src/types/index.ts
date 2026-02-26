export interface WindowState {
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

export interface DesktopIcon {
  id: string;
  label: string;
  icon: 'computer' | 'notepad' | 'trash' | 'documents' | 'paint' | 'docs' | 'video' | 'agent';
  windowId: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  type: 'markdown' | 'json';
  createdAt: number;
  updatedAt: number;
}

export interface UploadedDoc {
  id: string;
  type: string;
  url: string;
  name: string;
  timestamp: number;
  walletAddress?: string;
}

export interface TrashItem {
  id: string;
  name: string;
  type: string;
  content?: string;
  deletedAt?: number;
  timestamp?: number;
  created_at?: number;
}

export interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'awaiting_payment' | 'success' | 'error';
  error?: string;
  result?: { id: string; url: string; priceUsd?: number };
  onClose?: () => void;
}

export type AIMode = 'none' | 'summarize' | 'continue';