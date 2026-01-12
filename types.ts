
export type FileType = 'pdf' | 'image';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: FileType;
  thumbnail?: string;
  order: number;
  isSelected: boolean;
}

export enum QualityLevel {
  MAX = 'Maximum',
  HIGH = 'High',
  STANDARD = 'Standard',
  COMPRESSED = 'Compressed'
}

export interface MergeOptions {
  quality: QualityLevel;
  fitToPage: 'width' | 'height' | 'original';
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  message: string;
  error?: string;
}

export interface WorkerMessage {
  type: 'PROGRESS' | 'COMPLETED' | 'ERROR' | 'WARNING';
  progress?: number;
  message?: string;
  data?: Uint8Array;
  error?: string;
  fileName?: string;
}

export interface WorkerInput {
  files: { name: string; type: string; data: ArrayBuffer }[];
  options: MergeOptions;
}
