type SegmentBoxDTO = {
  left: number;
  top: number;
  page_number: number;
  type: string;
};

type SegmentDTO = {
  xml_file_name: string;
  language: string;
  main_language: boolean;
  xml_segments_boxes: SegmentBoxDTO[];
};

type ExtractionDTODevelopment = {
  key: string;
  xmls: SegmentDTO[];
};

type TranslationDTO = {
  language: string;
  text: string;
  needs_user_review: boolean;
};

type ParagraphDTO = {
  position: number;
  translations: TranslationDTO[];
};

type GetParagraphsResultDTO = {
  key: string;
  main_language: string;
  available_languages: string[];
  paragraphs: ParagraphDTO[];
};

type ExtractionDTOProduction = {
  key: string;
  xmls: {
    xml_file_name: string;
    language: string;
    is_main_language: boolean;
    xml_segments_boxes: {
      left: number;
      top: number;
      width: number;
      height: number;
      page_number: number;
      segment_type: string;
    }[];
  }[];
};

export type { ExtractionDTODevelopment, ExtractionDTOProduction, GetParagraphsResultDTO };
