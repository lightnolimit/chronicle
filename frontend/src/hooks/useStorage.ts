import { useState, useCallback } from 'react';
import type { Document, UploadedDoc, TrashItem } from '../types/index.js';
import * as storage from '../utils/storage.js';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(storage.loadDocuments);

  const saveDocument = useCallback((name: string, content: string, type: 'markdown' | 'json') => {
    setDocuments(prev => {
      const existing = prev.find(d => d.name === name);
      let updated: Document[];
      if (existing) {
        updated = prev.map(d => d.name === name ? { ...d, content, updatedAt: Date.now() } : d);
      } else {
        const newDoc: Document = {
          id: crypto.randomUUID(),
          name,
          content,
          type,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updated = [...prev, newDoc];
      }
      storage.saveDocuments(updated);
      return updated;
    });
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      storage.saveDocuments(updated);
      return updated;
    });
  }, []);

  return { documents, saveDocument, deleteDocument, setDocuments };
}

export function useUploads() {
  const [uploads, setUploads] = useState<UploadedDoc[]>(storage.loadUploads);

  const addUpload = useCallback((upload: UploadedDoc) => {
    setUploads(prev => {
      const updated = [upload, ...prev];
      storage.saveUploads(updated);
      return updated;
    });
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => {
      const updated = prev.filter(u => u.id !== id);
      storage.saveUploads(updated);
      return updated;
    });
  }, []);

  return { uploads, addUpload, removeUpload, setUploads };
}

export function useHiddenUploads() {
  const [hiddenUploadIds, setHiddenUploadIds] = useState<string[]>(storage.loadHiddenUploads);

  const hideUpload = useCallback((id: string) => {
    setHiddenUploadIds(prev => {
      const updated = [...prev, id];
      storage.saveHiddenUploads(updated);
      return updated;
    });
  }, []);

  const showUpload = useCallback((id: string) => {
    setHiddenUploadIds(prev => {
      const updated = prev.filter(i => i !== id);
      storage.saveHiddenUploads(updated);
      return updated;
    });
  }, []);

  return { hiddenUploadIds, hideUpload, showUpload };
}

export function useTrash() {
  const [trash, setTrash] = useState<TrashItem[]>(storage.loadTrash);

  const addToTrash = useCallback((item: Omit<TrashItem, 'deletedAt'>) => {
    setTrash(prev => {
      const updated = [...prev, { ...item, deletedAt: Date.now() }];
      storage.saveTrash(updated);
      return updated;
    });
  }, []);

  const removeFromTrash = useCallback((id: string) => {
    setTrash(prev => {
      const updated = prev.filter(t => t.id !== id);
      storage.saveTrash(updated);
      return updated;
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setTrash([]);
    storage.saveTrash([]);
  }, []);

  return { trash, addToTrash, removeFromTrash, emptyTrash };
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(storage.loadDarkMode);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      storage.saveDarkMode(newValue);
      return newValue;
    });
  }, []);

  return { isDarkMode, setIsDarkMode, toggleDarkMode };
}