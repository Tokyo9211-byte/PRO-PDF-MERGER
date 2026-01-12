
import { QualityLevel, MergeOptions } from '../types';

/**
 * Processes an image file based on quality presets and fitting options.
 * Standard PDF Page Size (A4) is used as a reference for fitting: 595 x 842 points.
 */
export const processImage = async (
  file: File,
  options: MergeOptions
): Promise<{ data: ArrayBuffer; mimeType: string }> => {
  const { quality, fitToPage } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // 1. Determine Quality Constraints
      let encoderQuality = 0.92;
      let maxResolution = Infinity; // Max pixels on longest side

      switch (quality) {
        case QualityLevel.MAX:
          encoderQuality = 1.0;
          maxResolution = 8000; // Limit for memory safety but very high
          break;
        case QualityLevel.HIGH:
          encoderQuality = 0.85;
          maxResolution = 3500; // ~300 DPI for A4
          break;
        case QualityLevel.STANDARD:
          encoderQuality = 0.75;
          maxResolution = 2000; // ~150 DPI for A4
          break;
        case QualityLevel.COMPRESSED:
          encoderQuality = 0.55;
          maxResolution = 1000; // ~72 DPI for A4
          break;
      }

      // 2. Handle Fitting Options (Standard A4 context: 595x842)
      // Note: We don't force it to 595 exactly in pixels here, but we use the ratio
      // if 'fitToPage' is selected to guide our resize logic.
      if (fitToPage === 'width') {
        const targetWidth = Math.min(width, 2480); // ~300DPI Width of A4
        height = (height / width) * targetWidth;
        width = targetWidth;
      } else if (fitToPage === 'height') {
        const targetHeight = Math.min(height, 3508); // ~300DPI Height of A4
        width = (width / height) * targetHeight;
        height = targetHeight;
      }

      // 3. Apply resolution caps based on QualityLevel
      if (width > maxResolution || height > maxResolution) {
        const ratio = Math.min(maxResolution / width, maxResolution / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));

      // Use better scaling quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            resolve({
              data: await blob.arrayBuffer(),
              mimeType: 'image/jpeg'
            });
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        encoderQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Corrupted or unsupported image: ${file.name}`));
    };
    img.src = url;
  });
};
