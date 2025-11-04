import { Document } from 'api/files.v2/model/Document';
import { FileContents } from 'api/files.v2/model/FileContents';
import { Segmentation } from 'api/files.v2/model/Segmentation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PXExtractionKey } from './PXExtractionKey';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: Document[];
  mainLanguage: LanguageISO6391;
  extractionKey: PXExtractionKey;
  files: FileContents[];
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
  extractParagraphs(entityStatus: ExtractParagraphInput): Promise<void>;
  getParagraphsResult(url: string): Promise<GetParagraphsResultOutput>;
}

export type {
  ExtractParagraphInput,
  GetParagraphsResultOutput,
  ParagraphOutput,
  PXExtractionService,
  TranslationOutput,
};
