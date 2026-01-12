
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ThumbnailCard from './ThumbnailCard';
import { FileItem } from '../types';

interface SortableThumbnailCardProps {
  file: FileItem;
  index: number;
  totalCount: number;
  onToggleSelect: (id: string, multiSelect?: boolean) => void;
  onRemove: (ids: string[]) => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  disabled?: boolean;
}

const SortableThumbnailCard: React.FC<SortableThumbnailCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: props.file.id,
    disabled: props.disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="h-full touch-none"
      {...attributes} 
      {...listeners}
    >
      <ThumbnailCard {...props} />
    </div>
  );
};

export default SortableThumbnailCard;
