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
  needsUserReview: boolean;
  paragraph: string;
};

type ParagraphOutput = {
  extractionId: PXExtractionId;
  pageNumber: number;
  translations: Translation[];
  defaultLanguage: LanguageISO6391;
};

type GetParagraphsResultOutput = {
  availableLanguages: LanguageISO6391[];
  paragraphs: ParagraphOutput[];
};

interface PXExtractionService {
  extractParagraph(extraction: ExtractParagraphInput): Promise<void>;
  getParagraphsResult(url: string): Promise<GetParagraphsResultOutput>;
}

export type {
  ExtractParagraphInput,
  PXExtractionService,
  GetParagraphsResultOutput,
  ParagraphOutput,
};
