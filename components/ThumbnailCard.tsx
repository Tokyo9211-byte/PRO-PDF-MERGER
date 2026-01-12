
import React from 'react';
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
  const handleClick = (e: React.MouseEvent) => {
    onToggleSelect(file.id, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  return (
    <div 
      className={`group relative h-full flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden
        ${file.isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'}
      `}
      onClick={handleClick}
    >
      {/* File Badge */}
      <div className="absolute top-2 left-2 z-10 flex space-x-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm
          ${file.type === 'pdf' ? 'bg-rose-500' : 'bg-amber-500'}
        `}>
          {file.type}
        </span>
      </div>

      {/* Remove Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove([file.id]); }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {file.thumbnail ? (
          <img 
            src={file.thumbnail} 
            alt={file.name} 
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-12 h-16 bg-slate-200 rounded mb-2"></div>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3 bg-white">
        <div className="text-xs font-bold text-slate-400 mb-1">#{index + 1}</div>
        <div className="text-sm font-semibold text-slate-800 truncate mb-1" title={file.name}>
          {file.name}
        </div>
        <div className="text-[11px] text-slate-500">
          {(file.size / 1024).toFixed(1)} KB
        </div>
      </div>

      {/* Reorder Controls */}
      <div className="px-3 pb-3 flex justify-between gap-2">
        <button 
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMoveBackward(); }}
          className="flex-1 py-1.5 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          disabled={index === totalCount - 1}
          onClick={(e) => { e.stopPropagation(); onMoveForward(); }}
          className="flex-1 py-1.5 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ThumbnailCard;
