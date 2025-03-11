import { HttpClient } from 'api/common.v2/contracts/HttpClient';
import { HttpField } from 'api/common.v2/contracts/HttpField';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PXExtractionKey } from 'api/paragraphExtraction/domain/PXExtractionKey';

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
      paragraphs: dto.paragraphs.map(p => ({
        paragraphNumber: p.position,
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
