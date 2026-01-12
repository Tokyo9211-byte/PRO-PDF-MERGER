
import React, { useState, useCallback } from 'react';
import { useFileManager } from './hooks/useFileManager';
import { usePDFProcessor } from './hooks/usePDFProcessor';
import { QualityLevel, MergeOptions } from './types';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ThumbnailGrid from './components/ThumbnailGrid';
import ActionBar from './components/ActionBar';
import ProgressBar from './components/ProgressBar';

const App: React.FC = () => {
  const {
    files,
    addFiles,
    removeFiles,
    clearAll,
    reorderFiles,
    toggleSelect,
    selectedCount,
    totalSize
  } = useFileManager();

  const [options, setOptions] = useState<MergeOptions>({
    quality: QualityLevel.MAX,
    fitToPage: 'original'
  });

  const { process, status, cancel } = usePDFProcessor();

  const handleMerge = useCallback(async () => {
    if (files.length === 0) return;
    try {
      await process(files, options);
    } catch (error) {
      console.error('Merge failed:', error);
      alert('An error occurred during merging. Please check the console for details.');
    }
  }, [files, options, process]);

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
      <Header />
      
      <main className="flex-1 space-y-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <FileUploader onFilesAdded={addFiles} />
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Manage Files ({files.length})
              </h2>
              <div className="text-sm text-slate-500">
                Total Size: {(totalSize / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 min-h-[400px]">
              <ThumbnailGrid 
                files={files} 
                onReorder={reorderFiles} 
                onToggleSelect={toggleSelect}
                onRemove={removeFiles}
              />
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No files uploaded yet. Drag and drop your PDFs or images to start.</p>
          </div>
        )}
      </main>

      {status.isProcessing && (
        <ProgressBar 
          progress={status.progress} 
          message={status.message} 
          onCancel={cancel} 
        />
      )}

      {files.length > 0 && (
        <ActionBar 
          fileCount={files.length}
          selectedCount={selectedCount}
          options={options}
          setOptions={setOptions}
          onClearAll={clearAll}
          onRemoveSelected={() => removeFiles(files.filter(f => f.isSelected).map(f => f.id))}
          onMerge={handleMerge}
          isProcessing={status.isProcessing}
        />
      )}

      <footer className="mt-auto py-8 text-center text-sm text-slate-500 border-t border-slate-100">
        <p className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          100% Secure Client-Side Processing. No files leave your browser.
        </p>
      </footer>
    </div>
  );
};

export default App;
