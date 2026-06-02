import { FileContents } from '#api/core/domain/files/FileContents.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { Segmentation } from '#api/segmentation.v2/domain/Segmentation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PXExtractionKey } from './PXExtractionKey.js';

type ExtractParagraphInput = {
  segmentations: Segmentation[];
  documents: PDFDocument[];
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
