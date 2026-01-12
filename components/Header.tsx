
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          ProPDF <span className="text-indigo-600">Merger</span>
        </h1>
        <p className="mt-2 text-slate-500">
          Professional browser-based tool to merge PDFs and convert images.
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center space-x-3 text-xs font-medium uppercase tracking-wider text-slate-400">
        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Client-Side Only</span>
        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Up to 10k Files</span>
      </div>
    </header>
  );
};

export default Header;
