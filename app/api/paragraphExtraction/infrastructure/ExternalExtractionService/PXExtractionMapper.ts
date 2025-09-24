// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { ExtractParagraphInput } from '../paragraphExtraction/domain/PXExtractionService.js';

import { ExtractionDTO } from './types';

class PXExtractionMapper {
  static toDto(input: ExtractParagraphInput): ExtractionDTO {
    return {
      key: input.extractionKey.key,
      // @ts-expect-error TS(7006): Parameter 'segmentation' implicitly has an 'any' t... Remove this comment to see the full error message
      xmls: input.segmentations.map(segmentation => {
        // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
        const language = input.documents.find(d => d.id === segmentation.fileId)?.language!;

        return {
          language,
          is_main_language: language === input.mainLanguage,
          xml_file_name: segmentation.xmlname!,
          // @ts-expect-error TS(7006): Parameter 'paragraph' implicitly has an 'any' type... Remove this comment to see the full error message
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
