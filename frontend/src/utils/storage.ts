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
    const items: TrashItem[] = saved ? JSON.parse(saved) : [];
    
    const manifestoFile: TrashItem = {
      id: 'manifesto',
      name: "One man's trash is another man's treasure.txt",
      type: 'txt',
      content: `One Man's Trash is Another Man's Treasure
=========================================

In an age of censorship, where truth ismutable and history is rewritten at will, we need verifiable truth.

The permaweb is not just a storage solution - it is a declaration of independence from the controllers of narrative.

Every upload to Chronicle is permanent. Every timestamp is verifiable. Every byte is immutable.

They can censor the present, but they cannot erase what has already been written to the blockchain.

We are building the archive that cannot be deleted. The memory that cannot be erased. The truth that cannot be censored.

This is our contribution to the resistance: not through violence, but through permanence. Not through revolution, but through revelation.

The truth will outlast any censorship. That is the promise of decentralized storage.

- The Chronicle Team

"Information wants to be free. Information also wants to be expensive... Information in a public network wants to be because of the competition of the publishers. Supply and demand. Information is very sticky. If you get it once, you can get it from others. But if you put it on a network, you're publishing it... The internet is the world's largest copying machine. Anything that can be copied will be copied. The answer to that is you make the copy have a price. You embed it in a system that makes people pay." - Stewart Brand`,
      created_at: Date.now(),
    };
    
    const hasManifesto = items.some(item => item.id === 'manifesto');
    if (!hasManifesto) {
      return [manifestoFile, ...items];
    }
    return items;
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