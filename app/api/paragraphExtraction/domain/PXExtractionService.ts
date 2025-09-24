// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/Segmentation... Remove this comment to see the full error message
import { Segmentation } from '../files.v2/model/Segmentation.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/Document.js'... Remove this comment to see the full error message
import { Document } from '../files.v2/model/Document.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/File.js' or ... Remove this comment to see the full error message
import { File } from '../files.v2/model/File.js';
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
  extractParagraphs(entityStatus: ExtractParagraphInput): Promise<void>;
  getParagraphsResult(url: string): Promise<GetParagraphsResultOutput>;
}

export type {
  ExtractParagraphInput,
  PXExtractionService,
  GetParagraphsResultOutput,
  ParagraphOutput,
  TranslationOutput,
};
