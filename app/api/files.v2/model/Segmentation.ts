export interface Paragraph {
  left: number;
  top: number;
  width: number;
  height: number;
  pageNumber: number;
  text: string;
  type: string;
}

export interface Segmentation {
  id: string;
  fileId: string;
  filename: string;
  status: 'processing' | 'failed' | 'ready';
  autoExpire?: number;
  xmlname?: string;
  pageWidth?: number;
  pageHeight?: number;
  paragraphs?: Paragraph[];
}
