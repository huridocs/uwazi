import { ExtractParagraphInput } from 'api/paragraphExtraction/domain/PXExtractionService';

import { ExtractionDTO } from './types';

class PXExtractionMapper {
  static toDto(input: ExtractParagraphInput): ExtractionDTO {
    return {
      key: input.extractionKey.key,
      xmls: input.segmentations.map(segmentation => {
        const language = input.documents.find(d => d.id === segmentation.fileId)?.language!;

        return {
          language,
          is_main_language: language === input.mainLanguage,
          xml_file_name: segmentation.xmlname!,
          xml_segments_boxes: segmentation.paragraphs!.map(paragraph => ({
            left: paragraph.left,
            top: paragraph.top,
            page_number: paragraph.pageNumber,
            segment_type: paragraph.type,
            width: paragraph.width,
            height: paragraph.height,
          })),
        };
      }),
    };
  }
}

export { PXExtractionMapper };
