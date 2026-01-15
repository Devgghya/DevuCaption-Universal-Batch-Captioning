
export interface AnnotationResult {
  caption: string;
  originalImage: string;
  fileName: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  BATCH_PROCESSING = 'BATCH_PROCESSING',
  READY_TO_PROCESS = 'READY_TO_PROCESS'
}

export enum CaptionLength {
  ONE_LINE = 'ONE_LINE',
  VERY_SHORT = 'VERY_SHORT',
  SHORT = 'SHORT',
  LONG = 'LONG',
  VERY_LONG = 'VERY_LONG'
}

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: string;
  error?: string;
  selected?: boolean;
}
