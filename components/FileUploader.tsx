
import React, { useCallback, useRef, useState } from 'react';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = ''; // Reset to allow same file upload
    }
  };

  return (
    <div 
      className={`relative p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-in-out cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' : 'border-slate-300 hover:border-slate-400 bg-white'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept=".pdf,image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileInputChange}
      />
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 mb-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Drop files here or click to upload</h3>
        <p className="text-slate-500 max-w-sm">
          Supports PDFs and all major image formats (JPG, PNG, WebP, SVG, etc).
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
