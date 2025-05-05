import { ObjectId } from 'mongodb';

interface BaseFileDBOType {
  _id: ObjectId;
  entity: string;
  filename: string;
  url?: string;
  creationDate: number;
}

interface ExtractedMetadataDBO {
  propertyID: string;
  name: string;
  timestamp: string;
  deleteSelection: boolean;
  selection: {
    text: string;
    selectionRectangles: {
      top: number;
      left: number;
      width: number;
      height: number;
      page: string;
    }[];
  };
}

interface DocumentFileDBOType extends BaseFileDBOType {
  type: 'document' | 'attachment' | 'custom';
  totalPages: number;
  language: string;
  extractedMetadata?: ExtractedMetadataDBO[];
}

export type FileDBOType = DocumentFileDBOType;
