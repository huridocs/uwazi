import { FileContents } from 'api/core/domain/files/FileContents';
import { ProcessedDocument } from 'api/core/domain/files/ProcessedDocument';
import { Segmentation } from 'api/core/domain/files/Segmentation';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PXExtractionKey } from './PXExtractionKey';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: ProcessedDocument[];
  mainLanguage: LanguageISO6391;
  extractionKey: PXExtractionKey;
  files: { filename: string; contents: FileContents }[];
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
