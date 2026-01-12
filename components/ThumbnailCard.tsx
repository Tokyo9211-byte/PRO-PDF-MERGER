import React, { useState } from 'react';
import { FileItem } from '../types';

interface ThumbnailCardProps {
  file: FileItem;
  index: number;
  totalCount: number;
  onToggleSelect: (id: string, multiSelect?: boolean) => void;
  onRemove: (ids: string[]) => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ 
  file, 
  index,
  totalCount,
  onToggleSelect,
  onRemove,
  onMoveForward,
  onMoveBackward
}) => {
  const [imgError, setImgError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(file.id, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  const isNoThumb = !file.thumbnail || file.thumbnail === 'error';

  return (
    <div 
      className={`group relative h-full flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer selection-ring
        ${file.isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg translate-y-[-2px]' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
      `}
      onClick={handleClick}
    >
      {/* Top Controls Overlay */}
      <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start pointer-events-none">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors pointer-events-auto
          ${file.isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white/80 border-slate-300 group-hover:border-slate-400'}
        `}>
          {file.isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove([file.id]); }}
          className="p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm pointer-events-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* File Badge */}
      <div className="absolute top-10 left-2 z-10">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm
          ${file.type === 'pdf' ? 'bg-rose-500' : 'bg-amber-500'}
        `}>
          {file.type}
        </span>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 min-h-[160px]">
        {!isNoThumb && !imgError ? (
          <img 
            src={file.thumbnail} 
            alt={file.name} 
            className="w-full h-full object-contain p-4"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-14 bg-slate-200 rounded-md mb-2 flex items-center justify-center">
               <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{file.type} File</p>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3 bg-white">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Page {index + 1}</span>
          <span className="text-[10px] font-bold text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
        </div>
        <div className="text-sm font-bold text-slate-800 truncate" title={file.name}>
          {file.name}
        </div>
      </div>

      {/* Reorder Controls */}
      <div className="px-3 pb-3 flex justify-between gap-2">
        <button 
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMoveBackward(); }}
          className="flex-1 py-1.5 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded-lg text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          disabled={index === totalCount - 1}
          onClick={(e) => { e.stopPropagation(); onMoveForward(); }}
          className="flex-1 py-1.5 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded-lg text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ThumbnailCard;