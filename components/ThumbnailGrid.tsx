import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import * as ReactWindow from 'react-window';
import { FileItem } from '../types';
import SortableThumbnailCard from './SortableThumbnailCard';
import ThumbnailCard from './ThumbnailCard';

const FixedSizeGrid = (ReactWindow as any).FixedSizeGrid || (ReactWindow as any).default?.FixedSizeGrid || (ReactWindow as any).default;

interface ThumbnailGridProps {
  files: FileItem[];
  onReorder: (id: string, newIndex: number) => void;
  onBulkReorder: (newFiles: FileItem[]) => void;
  onMoveSelectedTo: (targetId: string) => void;
  onToggleSelect: (id: string, multiSelect?: boolean) => void;
  onRemove: (ids: string[]) => void;
}

const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({ 
  files, 
  onReorder, 
  onBulkReorder,
  onMoveSelectedTo,
  onToggleSelect, 
  onRemove 
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const activeFile = files.find(f => f.id === active.id);
      
      if (activeFile?.isSelected) {
        // Multi-drag: move all selected items together to the target position
        onMoveSelectedTo(over.id as string);
      } else {
        // Single-drag: standard move
        const oldIndex = files.findIndex((f) => f.id === active.id);
        const newIndex = files.findIndex((f) => f.id === over.id);
        onBulkReorder(arrayMove(files, oldIndex, newIndex));
      }
    }
  };

  const activeFile = activeId ? files.find(f => f.id === activeId) : null;
  const selectedFiles = files.filter(f => f.isSelected);
  const dragCount = (activeFile?.isSelected) ? selectedFiles.length : 1;

  const isLargeSet = files.length > 500;
  const COLUMN_COUNT = 4;
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 380;

  if (isLargeSet && FixedSizeGrid) {
    const rowCount = Math.ceil(files.length / COLUMN_COUNT);
    return (
      <div className="w-full h-[650px] overflow-hidden p-4">
        <FixedSizeGrid
          columnCount={COLUMN_COUNT}
          columnWidth={CARD_WIDTH}
          height={650}
          rowCount={rowCount}
          rowHeight={CARD_HEIGHT}
          width={COLUMN_COUNT * CARD_WIDTH}
          className="scrollbar-thin mx-auto rounded-xl"
        >
          {({ columnIndex, rowIndex, style }: any) => {
            const index = rowIndex * COLUMN_COUNT + columnIndex;
            const file = files[index];
            if (!file) return null;
            return (
              <div style={{ ...style, padding: '12px' }}>
                <SortableThumbnailCard 
                  file={file} 
                  index={index}
                  totalCount={files.length}
                  onToggleSelect={onToggleSelect}
                  onRemove={onRemove}
                  onMoveForward={() => onReorder(file.id, index + 1)}
                  onMoveBackward={() => onReorder(file.id, index - 1)}
                  disabled={true} 
                />
              </div>
            );
          }}
        </FixedSizeGrid>
      </div>
    );
  }

  return (
    <div className="p-6 max-h-[750px] overflow-y-auto scrollbar-thin">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={files.map(f => f.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {files.map((file, idx) => (
              <SortableThumbnailCard 
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
        </SortableContext>

        <DragOverlay adjustScale={true}>
          {activeFile ? (
            <div className="relative drag-overlay-item">
              {/* Stack effect for multiple items */}
              {dragCount > 1 && (
                <>
                  <div className="absolute inset-0 translate-x-2 translate-y-2 bg-slate-200 rounded-xl border border-slate-300 opacity-50 z-[-1]"></div>
                  <div className="absolute inset-0 translate-x-4 translate-y-4 bg-slate-100 rounded-xl border border-slate-200 opacity-30 z-[-2]"></div>
                </>
              )}
              
              <ThumbnailCard 
                file={activeFile} 
                index={files.findIndex(f => f.id === activeId)}
                totalCount={files.length}
                onToggleSelect={() => {}}
                onRemove={() => {}}
                onMoveForward={() => {}}
                onMoveBackward={() => {}}
              />
              
              {dragCount > 1 && (
                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl z-50 uppercase tracking-tighter ring-4 ring-white">
                  Batch: {dragCount} files
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default ThumbnailGrid;