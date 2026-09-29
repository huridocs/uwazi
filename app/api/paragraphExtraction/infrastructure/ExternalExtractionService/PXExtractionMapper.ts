import { SegmentTypeNames } from '#segmentation';
import { ExtractParagraphInput } from '#api/paragraphExtraction/domain/PXExtractionService.js';

import { ExtractionDTO } from './types.js';

class PXExtractionMapper {
  static toDto(input: ExtractParagraphInput): ExtractionDTO {
    return {
      key: input.extractionKey.key,
      xmls: input.segmentations.map(segmentation => {
        const language = input.documents.find(d => d.id === segmentation.fileId)?.language!;

        return {
          language,
          is_main_language: language === input.mainLanguage,
          xml_file_name: segmentation.xmlFilename,
          xml_segments_boxes: segmentation.layout.segments.map(segment => ({
            left: segment.left,
            top: segment.top,
            page_number: segment.pageNumber,
            segment_type: SegmentTypeNames.toName(segment.type),
            width: segment.width,
            height: segment.height,
          })),
        };
      }),
    };
  }
}

export { PXExtractionMapper };
