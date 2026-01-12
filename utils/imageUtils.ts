import { QualityLevel, MergeOptions } from '../types';

/**
 * High-speed image processor with aggressive memory cleanup.
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
      // Memory cleanup: Revoke immediately upon load
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Quality Presets
      let encoderQuality = 0.90;
      let maxRes = 8000;

      switch (quality) {
        case QualityLevel.MAX:
          encoderQuality = 1.0;
          maxRes = 8000;
          break;
        case QualityLevel.HIGH:
          encoderQuality = 0.85;
          maxRes = 3500;
          break;
        case QualityLevel.STANDARD:
          encoderQuality = 0.75;
          maxRes = 2000;
          break;
        case QualityLevel.COMPRESSED:
          encoderQuality = 0.50;
          maxRes = 1200;
          break;
      }

      // Handle Scaling
      if (fitToPage === 'width') {
        const targetW = Math.min(width, 2480);
        height = (height / width) * targetW;
        width = targetW;
      } else if (fitToPage === 'height') {
        const targetH = Math.min(height, 3508);
        width = (width / height) * targetH;
        height = targetH;
      }

      // Resolution Constraint
      if (width > maxRes || height > maxRes) {
        const ratio = Math.min(maxRes / width, maxRes / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas failure'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const buffer = await blob.arrayBuffer();
            // Clear reference
            canvas.width = 1;
            canvas.height = 1;
            resolve({ data: buffer, mimeType: 'image/jpeg' });
          } else {
            reject(new Error('Blob generation failed'));
          }
        },
        'image/jpeg',
        encoderQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Corrupted image: ${file.name}`));
    };
    img.src = url;
  });
};