// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/HttpCli... Remove this comment to see the full error message
import { HttpClient } from '../common.v2/contracts/HttpClient.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/HttpFie... Remove this comment to see the full error message
import { HttpField } from '../common.v2/contracts/HttpField.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { PXExtractionKey } from '../paragraphExtraction/domain/PXExtractionKey.js';

import {
  ExtractParagraphInput,
  GetParagraphsResultOutput,
  PXExtractionService,
} from '../../domain/PXExtractionService';
import { GetParagraphsResultDTO } from './types';
import { PXExtractionMapper } from './PXExtractionMapper';

type Dependencies = {
  url: string;
  httpClient: HttpClient;
};

export class PXExternalExtractionService implements PXExtractionService {
  constructor(private dependencies: Dependencies) {}

  async getParagraphsResult(url: string): Promise<GetParagraphsResultOutput> {
    const dto = await this.dependencies.httpClient.get<GetParagraphsResultDTO>({ url });

    return {
      availableLanguages: dto.available_languages as LanguageISO6391[],
      extractionKey: new PXExtractionKey(dto.key),
      mainLanguage: dto.main_language as LanguageISO6391,
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      paragraphs: dto.paragraphs.map(p => ({
        paragraphNumber: p.position,
        // @ts-expect-error TS(7006): Parameter 't' implicitly has an 'any' type.
        translations: p.translations.map(t => ({
          language: t.language as LanguageISO6391,
          text: t.text,
          needsUserReview: t.needs_user_review,
          isMainLanguage: t.language === dto.main_language,
        })),
      })),
    };
  }

  async extractParagraphs(input: ExtractParagraphInput): Promise<void> {
    const dto = PXExtractionMapper.toDto(input);

    await this.dependencies.httpClient.postFormData({
      url: `${this.dependencies.url}/extract_paragraphs`,
      files: {
        xml_files: input.files,
      },
      fields: {
        json_data: new HttpField(dto),
      },
    });
  }
}
