import { ObjectId } from 'mongodb';

export interface ThumbnailDocument {
  _id: ObjectId;
  filename: string;
  type: 'thumbnail';
  entity?: string;
  language?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
}

export interface ProcessedPdfDocument {
  _id: ObjectId;
  entity: string;
  language: string;
  type: 'document';
  status: 'ready';
}

interface FileSchema {
  _id?: ObjectId;
  filename?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
  type?: 'document' | 'thumbnail' | 'attachment' | 'custom';
  entity?: string;
  language?: string;
  status?: 'processing' | 'failed' | 'ready';
  totalPages?: number;
  generatedToc?: boolean;
}

export interface Fixture {
  files: FileSchema[];
}
