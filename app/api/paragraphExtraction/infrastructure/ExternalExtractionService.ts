import { HttpClient } from 'api/common.v2/contracts/HttpClient';
import { HttpField } from 'api/common.v2/contracts/HttpField';

import { ExtractParagraphInput, PXExtractionService } from '../domain/PXExtractionService';

type SegmentBoxDTO = {
  left: number;
  top: number;
  page_number: number;
  type: string;
};

type SegmentDTO = {
  xml_file_name: string;
  language: string;
  is_main_language: boolean;
  xml_segments_boxes: SegmentBoxDTO[];
};

type ExtractionDTO = {
  key: string;
  xmls_segments: SegmentDTO[];
};

type Dependencies = {
  url: string;
  httpClient: HttpClient;
};

export class PXExternalExtractionService implements PXExtractionService {
  constructor(private dependencies: Dependencies) {}

  async extractParagraph({
    segmentations,
    defaultLanguage,
    documents,
    files,
    extractionId,
  }: ExtractParagraphInput): Promise<void> {
    const dto: ExtractionDTO = {
      key: extractionId.id,
      xmls_segments: segmentations.map(segmentation => {
        const language = documents.find(document => document.id === segmentation.fileId)?.language!;

        return {
          language,
          is_main_language: language === defaultLanguage,
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
