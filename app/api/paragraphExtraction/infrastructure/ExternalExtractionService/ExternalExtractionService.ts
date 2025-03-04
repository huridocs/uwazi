import { HttpClient } from 'api/common.v2/contracts/HttpClient';
import { HttpField } from 'api/common.v2/contracts/HttpField';
import { PXExtractionId } from 'api/paragraphExtraction/domain/PXExtractionId';
import { LanguageISO6391 } from 'shared/types/commonTypes';

import {
  ExtractParagraphInput,
  GetParagraphsResultOutput,
  PXExtractionService,
} from '../../domain/PXExtractionService';
import { ExtractionDTO, GetParagraphsResultDTO } from './types';

type Dependencies = {
  url: string;
  httpClient: HttpClient;
};

export class PXExternalExtractionService implements PXExtractionService {
  constructor(private dependencies: Dependencies) {}

  async getParagraphsResult(url: string): Promise<GetParagraphsResultOutput> {
    const dto = await this.dependencies.httpClient.get<GetParagraphsResultDTO>({ url });
    const extractionId = new PXExtractionId(dto.key);

    return {
      availableLanguages: dto.available_languages as LanguageISO6391[],
      extractionId,
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

  async extractParagraphs({
    segmentations,
    defaultLanguage,
    documents,
    files,
    extractionId,
  }: ExtractParagraphInput): Promise<void> {
    const documentsHaveDefaultLanguage = documents.some(
      document => document.language === defaultLanguage
    );

    const mainLanguage = documentsHaveDefaultLanguage ? defaultLanguage : documents[0].language;

    const dto: ExtractionDTO = {
      key: extractionId.id,
      xmls: segmentations.map(segmentation => {
        const language = documents.find(document => document.id === segmentation.fileId)?.language!;

        return {
          language,
          main_language: language === mainLanguage,
          xml_file_name: segmentation.xmlname!,
          xml_segments_boxes: segmentation.paragraphs!.map(paragraph => ({
            left: paragraph.left,
            top: paragraph.top,
            page_number: paragraph.pageNumber,
            type: paragraph.type,
          })),
        };
      }),
    };

    await this.dependencies.httpClient.postFormData({
      url: `${this.dependencies.url}/extract_paragraphs`,
      files: {
        xml_files: files,
      },
      fields: {
        json_data: new HttpField(dto),
      },
    });
  }
}
