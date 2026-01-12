
import React from 'react';

interface ProgressBarProps {
  progress: number;
  message: string;
  onCancel?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">Processing Files</h3>
            <p className="text-slate-500 text-sm">{message}</p>
          </div>
          <span className="text-indigo-600 font-black text-2xl">{Math.round(progress)}%</span>
        </div>

        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {onCancel && (
          <button 
            onClick={onCancel}
            className="w-full py-2.5 text-slate-500 hover:text-rose-600 font-semibold text-sm transition-colors border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-100"
          >
            Cancel Operation
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
