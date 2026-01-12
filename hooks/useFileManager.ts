
import { useState, useCallback, useMemo, useEffect } from 'react';
import { FileItem, FileType } from '../types';
import { generateThumbnail } from '../utils/fileUtils';

export const useFileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  // Cleanup thumbnails on unmount or removal
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.thumbnail && f.thumbnail.startsWith('blob:')) {
          URL.revokeObjectURL(f.thumbnail);
        }
      });
    };
  }, [files]);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => 
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      alert('No valid files selected. Please upload PDFs or images.');
      return;
    }

    const fileItems: FileItem[] = await Promise.all(
      validFiles.map(async (file, idx) => {
        const type: FileType = file.type === 'application/pdf' ? 'pdf' : 'image';
        const id = Math.random().toString(36).substring(7) + Date.now();
        
        // Generate thumbnail
        const thumb = await generateThumbnail(file, type);

        return {
          id,
          file,
          name: file.name,
          size: file.size,
          type,
          thumbnail: thumb,
          order: files.length + idx,
          isSelected: false,
        };
      })
    );

    setFiles(prev => [...prev, ...fileItems]);
  }, [files.length]);

  const removeFiles = useCallback((ids: string[]) => {
    setFiles(prev => {
      const remaining = prev.filter(f => !ids.includes(f.id));
      // Cleanup revoked URLs for removed files
      prev.filter(f => ids.includes(f.id)).forEach(f => {
        if (f.thumbnail && f.thumbnail.startsWith('blob:')) URL.revokeObjectURL(f.thumbnail);
      });
      return remaining.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach(f => {
      if (f.thumbnail && f.thumbnail.startsWith('blob:')) URL.revokeObjectURL(f.thumbnail);
    });
    setFiles([]);
  }, [files]);

  const reorderFiles = useCallback((id: string, newIndex: number) => {
    setFiles(prev => {
      const result = [...prev];
      const currentIndex = result.findIndex(f => f.id === id);
      if (currentIndex === -1 || newIndex < 0 || newIndex >= result.length) return prev;
      
      const [removed] = result.splice(currentIndex, 1);
      result.splice(newIndex, 0, removed);
      
      return result.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const toggleSelect = useCallback((id: string, multiSelect = false) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) return { ...f, isSelected: !f.isSelected };
      if (multiSelect) return f;
      return { ...f, isSelected: false };
    }));
  }, []);

  const selectedCount = useMemo(() => files.filter(f => f.isSelected).length, [files]);
  const totalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  return {
    files,
    addFiles,
    removeFiles,
    clearAll,
    reorderFiles,
    toggleSelect,
    selectedCount,
    totalSize
  };
};
