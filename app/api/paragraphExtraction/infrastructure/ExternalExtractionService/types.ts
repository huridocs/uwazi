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

type ExtractionDTO = {
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

export type { ExtractionDTO, GetParagraphsResultDTO };
