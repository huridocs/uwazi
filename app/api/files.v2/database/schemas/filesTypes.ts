import { ObjectId } from 'mongodb';

interface BaseFileDBOType {
  _id: ObjectId;
  entity: string;
}

interface DocumentFileDBOType extends BaseFileDBOType {
  type: 'document';
  totalPages: number;
}

export type FileDBOType = DocumentFileDBOType;
