import { ObjectId } from 'mongodb';

interface BaseFileDBOType {
  _id: ObjectId;
  entity: string;
  filename: string;
  url: string;
  creationDate: number;
}

interface DocumentFileDBOType extends BaseFileDBOType {
  type: 'document' | 'attachment' | 'custom';
  totalPages: number;
  language: string;
}

export type FileDBOType = DocumentFileDBOType;
