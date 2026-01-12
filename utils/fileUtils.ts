
import { FileType } from '../types';

declare const pdfjsLib: any;

export const generateThumbnail = async (file: File, type: FileType): Promise<string> => {
  if (type === 'image') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve('error');
      reader.readAsDataURL(file);
    });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof pdfjsLib === 'undefined') {
      return 'error'; 
    }
    
    // Configure worker source if needed, though usually handled by global script
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 0.4 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return 'error';

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    pdf.destroy();
    return dataUrl;
  } catch (error) {
    console.error('Thumbnail error:', error);
    return 'error'; 
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
