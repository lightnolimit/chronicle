import type { Document, UploadedDoc, TrashItem } from '../types/index.js';

const STORAGE_KEYS = {
  DOCUMENTS: 'chronicle-documents',
  UPLOADS: 'chronicle-uploads',
  HIDDEN_UPLOADS: 'chronicle-hidden-uploads',
  TRASH: 'chronicle-trash',
  DARK_MODE: 'chronicle-dark-mode',
} as const;

export function loadDocuments(): Document[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveDocuments(docs: Document[]): void {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

export function loadUploads(): UploadedDoc[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.UPLOADS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveUploads(uploads: UploadedDoc[]): void {
  localStorage.setItem(STORAGE_KEYS.UPLOADS, JSON.stringify(uploads));
}

export function loadHiddenUploads(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HIDDEN_UPLOADS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveHiddenUploads(hiddenIds: string[]): void {
  localStorage.setItem(STORAGE_KEYS.HIDDEN_UPLOADS, JSON.stringify(hiddenIds));
}

export function loadTrash(): TrashItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TRASH);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveTrash(items: TrashItem[]): void {
  localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(items));
}

export function loadDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
}

export function saveDarkMode(isDark: boolean): void {
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
}