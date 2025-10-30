import { ObjectId } from 'mongodb';

interface BaseFileDBOType {
  _id: ObjectId;
  entity: string;
  url: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  creationDate: number;
  type: 'custom' | 'document' | 'thumbnail' | 'attachment';
}

interface DocumentFileDBOType extends BaseFileDBOType {
  totalPages: number;
  language: string;
  status: 'processing' | 'failed' | 'ready';
}

export type FileDBOType = DocumentFileDBOType;
