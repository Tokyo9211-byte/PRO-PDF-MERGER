
import { useState, useCallback, useRef } from 'react';
import FileSaver from 'file-saver';
import { FileItem, MergeOptions, ProcessingStatus, WorkerMessage } from '../types';
import { processImage } from '../utils/imageUtils';

// Robust interop for file-saver
const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default?.saveAs || FileSaver;

// The worker code is inlined to bypass origin-mismatch issues in sandboxed environments.
// Using 'any' types inside the string to prevent environment-specific TS validation errors.
const WORKER_CODE = `
import { PDFDocument } from 'https://esm.sh/pdf-lib@^1.17.1';

self.onmessage = async (e) => {
  const { files, options } = e.data;
  
  try {
    const mergedPdf = await PDFDocument.create();
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      self.postMessage({
        type: 'PROGRESS',
        progress: (i / total) * 90,
        message: "Merging " + file.name + "..."
      });

      try {
        if (file.type === 'application/pdf') {
          const pdf = await PDFDocument.load(file.data, { 
            ignoreEncryption: true,
            throwOnInvalidObject: true 
          });
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
        } else {
          // Handle Image (already converted to ArrayBuffer in main thread)
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
        console.warn("Skipping file: " + file.name, innerError);
        self.postMessage({
          type: 'WARNING',
          fileName: file.name,
          message: 'File corrupted or invalid structure'
        });
      }
    }

    self.postMessage({ type: 'PROGRESS', progress: 95, message: 'Saving final document...' });
    const pdfBytes = await mergedPdf.save();
    
    // Transferrable buffer for performance
    const buffer = pdfBytes.buffer;
    (self as any).postMessage({
      type: 'COMPLETED',
      data: pdfBytes
    }, [buffer]);

  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      error: err.message || 'Unknown processing error'
    });
  }
};
`;

export const usePDFProcessor = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    message: ''
  });
  
  const workerRef = useRef<Worker | null>(null);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus({ isProcessing: false, progress: 0, message: 'Operation cancelled by user' });
  }, []);

  const process = useCallback(async (files: FileItem[], options: MergeOptions) => {
    setStatus({ isProcessing: true, progress: 0, message: 'Preparing files for processing...' });
    const failedFiles: string[] = [];

    try {
      // 1. Pre-process images in main thread (Canvas logic requires main thread)
      const processedFilesData = [];
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const preparationProgress = (i / files.length) * 15;
        
        setStatus(s => ({ 
          ...s, 
          progress: preparationProgress, 
          message: `Optimizing ${item.name}...` 
        }));

        try {
          if (item.type === 'image') {
            const { data, mimeType } = await processImage(item.file, options);
            processedFilesData.push({ name: item.name, type: mimeType, data });
          } else {
            processedFilesData.push({ 
              name: item.name, 
              type: 'application/pdf', 
              data: await item.file.arrayBuffer() 
            });
          }
        } catch (e: any) {
          console.error(`Failed to process ${item.name}:`, e);
          failedFiles.push(item.name);
        }
      }

      if (processedFilesData.length === 0) {
        throw new Error('No files were successfully processed. Check for corrupted inputs.');
      }

      // 2. Initialize Worker for heavy PDF merging using Blob URL
      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl, { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        switch (msg.type) {
          case 'PROGRESS':
            setStatus(s => ({ 
              ...s, 
              progress: 15 + (msg.progress || 0) * 0.8, 
              message: msg.message || 'Merging...' 
            }));
            break;
          case 'WARNING':
            if (msg.fileName) failedFiles.push(msg.fileName);
            break;
          case 'COMPLETED':
            if (msg.data) {
              // Cast to any to bypass SharedArrayBuffer / BlobPart type mismatch in strict TS
              const blobData = new Blob([msg.data as any], { type: 'application/pdf' });
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              
              if (typeof saveAs === 'function') {
                saveAs(blobData, `ProPDF_Merged_${timestamp}.pdf`);
              } else {
                const url = URL.createObjectURL(blobData);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ProPDF_Merged_${timestamp}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }
              
              const summary = failedFiles.length > 0 
                ? `Merge completed, but ${failedFiles.length} file(s) skipped due to errors.` 
                : 'Merge successful!';
              
              setStatus({ 
                isProcessing: false, 
                progress: 100, 
                message: summary 
              });

              if (failedFiles.length > 0) {
                alert(`Warning: The following files were skipped as they appear to be corrupted:\n\n${failedFiles.join('\n')}`);
              }
            }
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
          case 'ERROR':
            setStatus({ isProcessing: false, progress: 0, message: `Error: ${msg.error}`, error: msg.error });
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
        }
      };

      worker.onerror = (e) => {
        setStatus({ isProcessing: false, progress: 0, message: 'Worker error occurred', error: e.message });
        URL.revokeObjectURL(workerUrl);
        worker.terminate();
      };

      const buffers = processedFilesData.map(f => f.data);
      worker.postMessage({ files: processedFilesData, options }, buffers);

    } catch (err: any) {
      console.error(err);
      setStatus({ isProcessing: false, progress: 0, message: `System Error: ${err.message}`, error: err.message });
    }
  }, []);

  return { process, status, cancel };
};
