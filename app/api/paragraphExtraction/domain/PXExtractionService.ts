import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { Segmentation } from '#api/core/domain/files/Segmentation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PXExtractionKey } from '#api/paragraphExtraction/domain/PXExtractionKey.js';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: ProcessedPDF[];
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
