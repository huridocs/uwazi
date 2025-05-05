import { LanguageISO6391 } from 'shared/types/commonTypes';
import { BaseFile } from './BaseFile';

interface ExtractedMetadata {
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

export class Document extends BaseFile {
  filename: string;

  language: LanguageISO6391;

  extractedMetadata?: ExtractedMetadata[];

  constructor(
    id: string,
    entity: string,
    totalPages: number,
    filename: string,
    language: LanguageISO6391,
    extractedMetadata?: ExtractedMetadata[]
  ) {
    super(id, entity, totalPages);
    this.filename = filename;
    this.language = language;
    this.extractedMetadata = extractedMetadata;
  }
}
