
import { FileType } from '../types';

declare const pdfjsLib: any;

/**
 * Generates a thumbnail for a given file (PDF or Image)
 */
export const generateThumbnail = async (file: File, type: FileType): Promise<string> => {
  if (type === 'image') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  // PDF Thumbnail Generation using pdf.js
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return ''; // Return empty string as fallback
  }
};

/**
 * Formats bytes into human readable format
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
