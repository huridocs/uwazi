import { Segmentation } from 'api/files.v2/model/Segmentation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Document } from 'api/files.v2/model/Document';
import { File } from 'api/files.v2/model/File';
import { PXExtractionKey } from './PXExtractionKey';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: Document[];
  mainLanguage: LanguageISO6391;
  extractionKey: PXExtractionKey;
  files: File[];
};

type TranslationOutput = {
  language: LanguageISO6391;
  needsUserReview: boolean;
  text: string;
  isMainLanguage: boolean;
};

type ParagraphOutput = {
  paragraphNumber: number;
  translations: TranslationOutput[];
};

type GetParagraphsResultOutput = {
  extractionKey: PXExtractionKey;
  mainLanguage: LanguageISO6391;
  availableLanguages: LanguageISO6391[];
  paragraphs: ParagraphOutput[];
};

interface PXExtractionService {
  extractParagraphs(extraction: ExtractParagraphInput): Promise<void>;
  getParagraphsResult(url: string): Promise<GetParagraphsResultOutput>;
}

export type {
  ExtractParagraphInput,
  PXExtractionService,
  GetParagraphsResultOutput,
  ParagraphOutput,
  TranslationOutput,
};
