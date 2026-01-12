
import React from 'react';
import * as ReactWindow from 'react-window';
import { FileItem } from '../types';
import ThumbnailCard from './ThumbnailCard';

/**
 * Robust interop for react-window which often has varying export structures 
 * depending on the ESM provider (esm.sh) and React version.
 */
const FixedSizeGrid = (ReactWindow as any).FixedSizeGrid || (ReactWindow as any).default?.FixedSizeGrid || (ReactWindow as any).default;

const ThumbnailGrid: React.FC<{
  files: FileItem[];
  onReorder: (id: string, newIndex: number) => void;
  onToggleSelect: (id: string, multiSelect?: boolean) => void;
  onRemove: (ids: string[]) => void;
}> = ({ 
  files, 
  onReorder, 
  onToggleSelect, 
  onRemove 
}) => {
  // Constants for virtualization
  const COLUMN_COUNT = 4;
  const GUTTER_SIZE = 16;
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 360;

  const rowCount = Math.ceil(files.length / COLUMN_COUNT);

  // If FixedSizeGrid failed to load, fallback to a standard grid to prevent crash
  if (!FixedSizeGrid) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {files.map((file, idx) => (
            <ThumbnailCard 
              key={file.id}
              file={file} 
              index={idx}
              totalCount={files.length}
              onToggleSelect={onToggleSelect}
              onRemove={onRemove}
              onMoveForward={() => onReorder(file.id, idx + 1)}
              onMoveBackward={() => onReorder(file.id, idx - 1)}
            />
          ))}
        </div>
      </div>
    );
  }

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const fileIndex = rowIndex * COLUMN_COUNT + columnIndex;
    const file = files[fileIndex];

    if (!file) return null;

    return (
      <div 
        style={{
          ...style,
          left: (style.left as number) + GUTTER_SIZE,
          top: (style.top as number) + GUTTER_SIZE,
          width: (style.width as number) - GUTTER_SIZE,
          height: (style.height as number) - GUTTER_SIZE,
        }}
      >
        <ThumbnailCard 
          file={file} 
          index={fileIndex}
          totalCount={files.length}
          onToggleSelect={onToggleSelect}
          onRemove={onRemove}
          onMoveForward={() => onReorder(file.id, fileIndex + 1)}
          onMoveBackward={() => onReorder(file.id, fileIndex - 1)}
        />
      </div>
    );
  };

  return (
    <div className="w-full h-[600px] overflow-hidden p-4">
      <FixedSizeGrid
        columnCount={COLUMN_COUNT}
        columnWidth={CARD_WIDTH}
        height={600}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT}
        width={COLUMN_COUNT * CARD_WIDTH}
        className="scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      >
        {Cell}
      </FixedSizeGrid>
    </div>
  );
};

export default ThumbnailGrid;
