import { useState, useCallback, useMemo, useEffect } from 'react';
import { FileItem, FileType } from '../types';
import { generateThumbnail } from '../utils/fileUtils';

export const useFileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

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

  const moveSelectedTo = useCallback((targetId: string) => {
    setFiles(prev => {
      const selectedItems = prev.filter(f => f.isSelected);
      if (selectedItems.length === 0) return prev;

      const unselectedItems = prev.filter(f => !f.isSelected);
      let targetIdx = unselectedItems.findIndex(f => f.id === targetId);
      
      // If targetId is not in unselected (meaning it's one of the items we're moving)
      // we find where it originally was in the full list
      if (targetIdx === -1) {
        const originalIdx = prev.findIndex(f => f.id === targetId);
        targetIdx = prev.slice(0, originalIdx).filter(f => !f.isSelected).length;
      }

      const result = [...unselectedItems];
      result.splice(targetIdx, 0, ...selectedItems);

      return result.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const bulkReorder = useCallback((newFiles: FileItem[]) => {
    setFiles(newFiles.map((f, i) => ({ ...f, order: i })));
  }, []);

  const toggleSelect = useCallback((id: string, multiSelect = false) => {
    setFiles(prev => {
      const clickedItem = prev.find(f => f.id === id);
      if (!clickedItem) return prev;

      if (multiSelect) {
        return prev.map(f => f.id === id ? { ...f, isSelected: !f.isSelected } : f);
      } else {
        // If it's already selected and we click it, and it's the only one, deselect.
        // Otherwise, make it the only selected one.
        const onlySelected = prev.filter(f => f.isSelected).length === 1 && clickedItem.isSelected;
        return prev.map(f => ({
          ...f,
          isSelected: f.id === id ? !onlySelected : false
        }));
      }
    });
  }, []);

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

  const selectedCount = useMemo(() => files.filter(f => f.isSelected).length, [files]);
  const totalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  return {
    files,
    addFiles,
    removeFiles,
    clearAll,
    reorderFiles,
    bulkReorder,
    moveSelectedTo,
    toggleSelect,
    selectedCount,
    totalSize
  };
};