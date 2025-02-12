import { Segmentation } from 'api/files.v2/model/Segmentation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from 'api/files.v2/model/Document';
import { File } from 'api/files.v2/model/File';
import { PXExtractionId } from './PXExtractionId';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: Document[];
  defaultLanguage: LanguageISO6391;
  extractionId: PXExtractionId;
  files: File[];
};

interface PXExtractionService {
  extractParagraph(extraction: ExtractParagraphInput): Promise<void>;
}

export type { ExtractParagraphInput, PXExtractionService };
