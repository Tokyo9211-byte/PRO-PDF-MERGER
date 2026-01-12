
import React from 'react';
import { QualityLevel, MergeOptions } from '../types';

interface ActionBarProps {
  fileCount: number;
  selectedCount: number;
  options: MergeOptions;
  setOptions: (options: MergeOptions) => void;
  onClearAll: () => void;
  onRemoveSelected: () => void;
  onMerge: () => void;
  isProcessing: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  fileCount,
  selectedCount,
  options,
  setOptions,
  onClearAll,
  onRemoveSelected,
  onMerge,
  isProcessing
}) => {
  const qualityDescriptions: Record<QualityLevel, string> = {
    [QualityLevel.MAX]: 'Original quality, no compression',
    [QualityLevel.HIGH]: 'Sharp images, 300 DPI equivalent',
    [QualityLevel.STANDARD]: 'Balanced size/quality, 150 DPI',
    [QualityLevel.COMPRESSED]: 'Smallest size, 72 DPI equivalent'
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left: Stats & Bulk Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Queue</span>
            <span className="text-base font-black text-indigo-700">{fileCount}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <button 
                onClick={onRemoveSelected}
                className="text-sm font-bold text-rose-600 hover:text-rose-700 px-3 py-1 bg-rose-50 rounded-lg transition-colors"
              >
                Delete Selected ({selectedCount})
              </button>
            )}
            <button 
              onClick={onClearAll}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Middle: Professional Controls */}
        <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
          <div className="flex flex-col px-3">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-0.5 ml-1">Export Quality</label>
            <div className="flex items-center gap-2">
              <select 
                value={options.quality}
                onChange={(e) => setOptions({ ...options, quality: e.target.value as QualityLevel })}
                className="bg-transparent border-none font-bold text-sm text-slate-700 focus:ring-0 cursor-pointer pr-8"
              >
                {Object.values(QualityLevel).map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <span className="hidden md:inline text-[10px] text-slate-400 italic">
                {qualityDescriptions[options.quality]}
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          <div className="flex flex-col px-3 pr-4">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-0.5 ml-1">Scaling</label>
            <select 
              value={options.fitToPage}
              onChange={(e) => setOptions({ ...options, fitToPage: e.target.value as any })}
              className="bg-transparent border-none font-bold text-sm text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="original">Original Size</option>
              <option value="width">Fit to Width</option>
              <option value="height">Fit to Height</option>
            </select>
          </div>
        </div>

        {/* Right: Primary Action */}
        <button 
          onClick={onMerge}
          disabled={isProcessing || fileCount < 1}
          className="w-full lg:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Merging...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Merge Documents
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ActionBar;
