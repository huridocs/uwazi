import { ObjectId } from 'mongodb';

type FileType = 'document' | 'thumbnail' | 'attachment' | 'custom';

interface FileDocument {
  _id: ObjectId;
  type: FileType;
  filename?: string;
  originalname?: string;
  mimetype?: string;
  entity?: string;
  language?: string;
  size?: number;
  creationDate?: number;
}

interface Fixture {
  files: FileDocument[];
}

export type { FileDocument, Fixture };
