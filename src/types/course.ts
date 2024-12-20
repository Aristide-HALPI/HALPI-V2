export interface Chapter {
  id: string;
  name?: string;
  file?: File;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  status: 'uploaded' | 'processing' | 'ready';
  title: string;
  order: number;
}