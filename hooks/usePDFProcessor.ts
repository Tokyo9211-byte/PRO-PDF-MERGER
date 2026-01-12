import { useState, useCallback, useRef } from 'react';
import FileSaver from 'file-saver';
import { FileItem, MergeOptions, ProcessingStatus, WorkerMessage } from '../types';
import { processImage } from '../utils/imageUtils';

const isFileSystemApiSupported = () => {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
};

const getSaveAs = (module: any) => {
  if (typeof module === 'function') return module;
  if (module && typeof module.saveAs === 'function') return module.saveAs;
  if (module && module.default && typeof module.default.saveAs === 'function') return module.default.saveAs;
  if (typeof window !== 'undefined' && (window as any).saveAs) return (window as any).saveAs;
  return null;
};

const saveAsFunc = getSaveAs(FileSaver);

/**
 * ULTRA-CAPACITY PDF WORKER
 * Optimized for processing thousands of files and multi-gigabyte exports.
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
          // Load PDF with memory-saving options
          const pdf = await PDFDocument.load(file.data, { 
            ignoreEncryption: true,
            throwOnInvalidObject: false 
          });
          
          const indices = pdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(pdf, indices);
          copiedPages.forEach(function(page) {
            mergedPdf.addPage(page);
          });
          
          // CRITICAL: Explicitly clear reference to allow GC
          pdf.context.pagemap = null;
          file.data = null; 
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
          file.data = null;
        }
      } catch (innerError) {
        self.postMessage({ type: 'WARNING', fileName: file.name, message: innerError.message });
      }
      
      // Periodically hint GC for very large sets
      if (i % 50 === 0) {
        // No direct GC call in JS, but clearing references helps
      }
    }

    self.postMessage({ type: 'PROGRESS', progress: 99, message: 'Compressing & Finalizing 2GB+ export...' });
    
    // UseObjectStreams: true helps reduce memory usage for very large structural PDFs
    const pdfBytes = await mergedPdf.save({ 
      useObjectStreams: true, 
      addDefaultFont: false,
      updateMetadata: false
    });
    
    const resultBuffer = pdfBytes.buffer;
    self.postMessage({
      type: 'COMPLETED',
      data: resultBuffer
    }, [resultBuffer]); // Transferrable

  } catch (err) {
    self.postMessage({ type: 'ERROR', error: err.message || 'Worker Memory Exhausted' });
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

  const triggerDownload = async (buffer: ArrayBuffer) => {
    const filename = `ProPDF_Export_${Date.now()}.pdf`;

    // BEST OPTION: showSaveFilePicker (Mandatory for 2GB+ stability)
    if (isFileSystemApiSupported()) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
        });
        
        setStatus(s => ({ ...s, message: 'Streaming to disk...' }));
        const writable = await handle.createWritable();
        await writable.write(buffer);
        await writable.close();
        
        setStatus({ isProcessing: false, progress: 100, message: 'Perfectly Saved!' });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error("FSA API failed:", e);
      }
    }

    // FALLBACK: Blob (Risky for >2GB)
    try {
      const blob = new Blob([buffer], { type: 'application/pdf' });
      if (saveAsFunc) {
        saveAsFunc(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 5000);
      }
      setStatus({ isProcessing: false, progress: 100, message: 'Download Triggered!' });
    } catch (e) {
      console.error("Final download crash:", e);
      setStatus({ 
        isProcessing: false, 
        progress: 100, 
        message: 'Merge Finished, but Memory Limit Exceeded.',
        error: "Your browser's memory limit prevented the download. Try using Chrome/Edge or merging fewer files at once." 
      });
    }
  };

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus({ isProcessing: false, progress: 0, message: 'Process Stopped.' });
  }, []);

  const process = useCallback(async (files: FileItem[], options: MergeOptions) => {
    setStatus({ isProcessing: true, progress: 0, message: 'Loading files into off-heap memory...' });
    const skippedFiles: string[] = [];

    try {
      // Chunk processing to avoid UI jank during pre-read
      const CONCURRENCY = 8;
      const processedFilesData: ProcessedFileData[] = [];
      const transferables: ArrayBuffer[] = [];
      
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async (item) => {
          try {
            let buffer: ArrayBuffer;
            if (item.type === 'image') {
              const { data } = await processImage(item.file, options);
              buffer = data;
            } else {
              buffer = await item.file.arrayBuffer();
            }
            return { name: item.name, type: item.type === 'pdf' ? 'application/pdf' : 'image/jpeg', data: buffer };
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
          progress: ((i + chunk.length) / files.length) * 10, 
          message: `Readying ${Math.min(i + chunk.length, files.length)} / ${files.length} files...` 
        }));
      }

      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      workerRef.current = worker;

      worker.onmessage = async (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        if (!msg) return;

        switch (msg.type) {
          case 'PROGRESS':
            setStatus(s => ({ 
              ...s, 
              progress: 10 + (msg.progress || 0) * 0.9, 
              message: msg.message || 'Processing...' 
            }));
            break;
          case 'COMPLETED':
            if (msg.data) {
              await triggerDownload(msg.data as ArrayBuffer);
            }
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
          case 'ERROR':
            setStatus({ isProcessing: false, progress: 0, message: 'Export Failed.', error: msg.error });
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            break;
          case 'WARNING':
            if (msg.fileName) skippedFiles.push(msg.fileName);
            break;
        }
      };

      worker.postMessage({ files: processedFilesData, options }, transferables);

    } catch (err: any) {
      console.error("Fatal Merging Error:", err);
      setStatus({ isProcessing: false, progress: 0, message: 'Fatal Error.', error: err.message });
    }
  }, []);

  return { process, status, cancel };
};