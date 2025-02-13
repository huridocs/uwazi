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

type Translation = {
  language: LanguageISO6391;
  text: string;
  needsUserReview: boolean;
};

type Paragraph = {
  position: number;
  translations: Translation[];
};

type GetParagraphsResultOutput = {
  extractionId: PXExtractionId;
  mainLanguage: LanguageISO6391;
  availableLanguages: LanguageISO6391[];
  paragraphs: Paragraph[];
};

interface PXExtractionService {
  extractParagraph(extraction: ExtractParagraphInput): Promise<void>;
  getParagraphsResult(url: string): Promise<GetParagraphsResultOutput>;
}

export type { ExtractParagraphInput, PXExtractionService, GetParagraphsResultOutput };
