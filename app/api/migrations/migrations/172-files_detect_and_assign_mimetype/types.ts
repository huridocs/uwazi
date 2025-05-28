import { ObjectId } from 'mongodb';

interface Fixture {
  files: FileType[];
}

type ObjectIdSchema = string | ObjectId;

interface ExtractedMetadataSchema {
  propertyID?: string;
  name?: string;
  timestamp?: string;
  deleteSelection?: boolean;
  selection?: {
    text?: string;
    selectionRectangles?: {
      top: number;
      left: number;
      width: number;
      height: number;
      page?: string;
    }[];
  };
}

interface TocSchema {
  selectionRectangles?: {
    top: number;
    left: number;
    width: number;
    height: number;
    page?: string;
  }[];
  label?: string;
  indentation?: number;
}

interface FileType {
  _id?: ObjectIdSchema;
  entity?: string;
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  creationDate?: number;
  language?: string;
  type?: 'custom' | 'document' | 'thumbnail' | 'attachment';
  url?: string;
  status?: 'processing' | 'failed' | 'ready';
  totalPages?: number;
  generatedToc?: boolean;
  uploaded?: boolean;
  fullText?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^[0-9]+$".
     */
    [k: string]: string;
  };
  toc?: TocSchema[];
  extractedMetadata?: ExtractedMetadataSchema[];
}

export type { Fixture, FileType };
