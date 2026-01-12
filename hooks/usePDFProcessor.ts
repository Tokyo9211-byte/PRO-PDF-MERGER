import { useState, useCallback, useRef } from 'react';
import FileSaver from 'file-saver';
import { FileItem, MergeOptions, ProcessingStatus, WorkerMessage } from '../types';
import { processImage } from '../utils/imageUtils';

// Robust helper to get a working saveAs function
const getSaveAs = (module: any) => {
  if (typeof module === 'function') return module;
  if (module && typeof module.saveAs === 'function') return module.saveAs;
  if (module && module.default && typeof module.default.saveAs === 'function') return module.default.saveAs;
  if (typeof window !== 'undefined' && (window as any).saveAs) return (window as any).saveAs;
  return null;
};

const saveAsFunc = getSaveAs(FileSaver);

/**
 * PRODUCTION-GRADE PDF WORKER (STRICT VANILLA JS)
 * Uses importScripts to load dependencies in a worker-safe way.
 */
const WORKER_CODE = `
importScripts('https://unpkg.com/pdf-lib/dist/pdf-lib.min.js');

self.onmessage = async (e) => {
  const { files, options } = e.data;
  const { PDFDocument } = PDFLib;
  
  try {
    const mergedPdf = await PDFDocument.create();
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      
      self.postMessage({
        type: 'PROGRESS',
        progress: (i / total) * 100,
        message: "Merging " + (i + 1) + " of " + total + ": " + file.name
      });

      try {
        if (file.type === 'application/pdf') {
          const pdf = await PDFDocument.load(file.data, { 
            ignoreEncryption: true,
            throwOnInvalidObject: false 
          });
          
          const indices = pdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(pdf, indices);
          copiedPages.forEach(function(page) {
            mergedPdf.addPage(page);
          });
          
          pdf.context.pagemap = null;
        } else {
          var image;
          if (file.type === 'image/jpeg') {
            image = await mergedPdf.embedJpg(file.data);
          } else if (file.type === 'image/png') {
            image = await mergedPdf.embedPng(file.data);
          } else {
            image = await mergedPdf.embedJpg(file.data);
          }

          var dims = image.scale(1);
          var page = mergedPdf.addPage([dims.width, dims.height]);
          page.drawImage(image, { x: 0, y: 0, width: dims.width, height: dims.height });
        }
      } catch (innerError) {
        self.postMessage({
          type: 'WARNING',
          fileName: file.name,
          message: innerError.message
        });
      }
    }

    self.postMessage({ type: 'PROGRESS', progress: 99, message: 'Wrapping up final PDF...' });
    
    const pdfBytes = await mergedPdf.save({ 
      useObjectStreams: true,
      addDefaultFont: false
    });
    
    const resultBuffer = pdfBytes.buffer;
    // We send the Uint8Array back, and transfer the buffer for zero-copy performance
    self.postMessage({
      type: 'COMPLETED',
      data: pdfBytes
    }, [resultBuffer]);

  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      error: err.message || 'Worker thread failed'
    });
  }
};
`;

interface ProcessedFileData {
  name: string;
  type: string;
  data: ArrayBuffer;
}

export const usePDFProcessor = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    message: ''
  });
  
  const workerRef = useRef<Worker | null>(null);

  const triggerDownload = (data: Uint8Array) => {
    try {
      // Explicitly cast to any or BlobPart array to satisfy TS in restricted environments
      const blobPart: any = data;
      const finalBlob = new Blob([blobPart], { type: 'application/pdf' });
      const filename = `ProPDF_Merged_${Date.now()}.pdf`;

      if (saveAsFunc) {
        saveAsFunc(finalBlob, filename);
      } else {
        // Ultimate fallback for automatic download
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
      }
    } catch (e) {
      console.error("Download trigger failed:", e);
      setStatus(s => ({ ...s, error: "Download failed. Please try again." }));
    }
  };

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus({ isProcessing: false, progress: 0, message: 'Terminated.' });
  }, []);

  const process = useCallback(async (files: FileItem[], options: MergeOptions) => {
    setStatus({ isProcessing: true, progress: 0, message: 'Initializing...' });
    const skippedFiles: string[] = [];

    try {
      const CONCURRENCY = 15;
      const processedFilesData: ProcessedFileData[] = [];
      const transferables: ArrayBuffer[] = [];
      
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async (item) => {
          try {
            if (item.type === 'image') {
              const { data, mimeType } = await processImage(item.file, options);
              return { name: item.name, type: mimeType, data };
            } else {
              const data = await item.file.arrayBuffer();
              return { name: item.name, type: 'application/pdf', data };
            }
          } catch (e) {
            skippedFiles.push(item.name);
            return null;
          }
        }));
        
        results.forEach(r => {
          if (r) {
            processedFilesData.push(r);
            transferables.push(r.data);
          }
        });

        setStatus(s => ({ 
          ...s, 
          progress: ((i + chunk.length) / files.length) * 15, 
          message: `Readying ${Math.min(i + chunk.length, files.length)} of ${files.length} files...` 
        }));
      }

      if (processedFilesData.length === 0) throw new Error('No files found to process.');

      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        if (!msg) return;

        switch (msg.type) {
          case 'PROGRESS':
            setStatus(s => ({ 
              ...s, 
              progress: 15 + (msg.progress || 0) * 0.85, 
              message: msg.message || 'Processing...' 
            }));
            break;
          case 'COMPLETED':
            if (msg.data) {
              triggerDownload(msg.data);
              setStatus({ isProcessing: false, progress: 100, message: 'Finished!' });
              if (skippedFiles.length > 0) {
                alert(`Operation complete. Note: ${skippedFiles.length} files were corrupted and skipped.`);
              }
            }
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
          case 'ERROR':
            setStatus({ isProcessing: false, progress: 0, message: 'Error occurred.', error: msg.error });
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
          case 'WARNING':
            if (msg.fileName) skippedFiles.push(msg.fileName);
            break;
        }
      };

      worker.onerror = (e) => {
        setStatus({ isProcessing: false, progress: 0, message: 'Worker error.', error: e.message });
        URL.revokeObjectURL(workerUrl);
      };

      // Send the data and transfer the buffers
      worker.postMessage({ files: processedFilesData, options }, transferables);

    } catch (err: any) {
      console.error("PDF Processing Thread Error:", err);
      setStatus({ isProcessing: false, progress: 0, message: 'Fatal failure.', error: err.message });
    }
  }, []);

  return { process, status, cancel };
};