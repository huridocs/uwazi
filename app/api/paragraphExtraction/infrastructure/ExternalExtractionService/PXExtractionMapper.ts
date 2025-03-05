/* eslint-disable max-classes-per-file */
import { ExtractParagraphInput } from 'api/paragraphExtraction/domain/PXExtractionService';

import { ExtractionDTODevelopment, ExtractionDTOProduction } from './types';

const getMainLanguage = (input: ExtractParagraphInput) => {
  const documentsHaveDefaultLanguage = input.documents.some(
    document => document.language === input.defaultLanguage
  );

  const mainLanguage = documentsHaveDefaultLanguage
    ? input.defaultLanguage
    : input.documents[0].language;

  return mainLanguage;
};

class PXExtractionMapperDevelopment {
  static toDto(input: ExtractParagraphInput): ExtractionDTODevelopment {
    return {
      key: input.extractionId.id,
      xmls: input.segmentations.map(segmentation => {
        const language = input.documents.find(d => d.id === segmentation.fileId)?.language!;

        return {
          language,
          main_language: language === getMainLanguage(input),
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
  }
}

class PXExtractionMapperProduction {
  static toDto(input: ExtractParagraphInput): ExtractionDTOProduction {
    return {
      key: input.extractionId.id,
      xmls: input.segmentations.map(segmentation => {
        const language = input.documents.find(d => d.id === segmentation.fileId)?.language!;

        return {
          language,
          is_main_language: language === getMainLanguage(input),
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

class PXExtractionMapper {
  static toDto(input: ExtractParagraphInput) {
    const isProduction = process.env.NODE_ENV === 'production';

    return isProduction
      ? PXExtractionMapperProduction.toDto(input)
      : PXExtractionMapperDevelopment.toDto(input);
  }
}

export { PXExtractionMapper };
