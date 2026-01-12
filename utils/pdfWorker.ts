
import { PDFDocument } from 'https://esm.sh/pdf-lib@^1.17.1';

self.onmessage = async (e: MessageEvent) => {
  const { files, options } = e.data;
  
  try {
    const mergedPdf = await PDFDocument.create();
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      self.postMessage({
        type: 'PROGRESS',
        progress: (i / total) * 90,
        message: `Merging ${file.name}...`
      });

      try {
        if (file.type === 'application/pdf') {
          const pdf = await PDFDocument.load(file.data, { 
            ignoreEncryption: true,
            throwOnInvalidObject: true 
          });
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } else {
          // Handle Image (already converted to ArrayBuffer)
          let image;
          if (file.type === 'image/jpeg') {
            image = await mergedPdf.embedJpg(file.data);
          } else {
            image = await mergedPdf.embedPng(file.data);
          }

          const { width, height } = image.scale(1);
          const page = mergedPdf.addPage([width, height]);
          page.drawImage(image, { x: 0, y: 0, width, height });
        }
      } catch (innerError) {
        console.warn(`Skipping corrupted file: ${file.name}`, innerError);
        self.postMessage({
          type: 'WARNING',
          fileName: file.name,
          message: 'File corrupted or invalid structure'
        });
      }
    }

    self.postMessage({ type: 'PROGRESS', progress: 95, message: 'Saving final document...' });
    const pdfBytes = await mergedPdf.save();
    
    (self as any).postMessage({
      type: 'COMPLETED',
      data: pdfBytes
    }, [pdfBytes.buffer]);

  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      error: err.message || 'Unknown processing error'
    });
  }
};
