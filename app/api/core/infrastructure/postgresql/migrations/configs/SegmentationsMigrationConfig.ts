import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

type LegacyParagraph = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  page_number?: number;
  page_width?: number;
  page_height?: number;
  text?: string;
  type?: string;
};

type LegacyLayout = {
  page_width?: number;
  page_height?: number;
  paragraphs?: LegacyParagraph[];
};

type Page = { number: number; width: number; height: number };

/** The service's segment type names, as Mongo stores them, to the names the table keeps. */
const TYPE_BY_STORED: Record<string, string> = {
  Text: 'text',
  Title: 'title',
  'Section header': 'section_header',
  'List item': 'list_item',
  Table: 'table',
  Picture: 'picture',
  Caption: 'caption',
  Formula: 'formula',
  Footnote: 'footnote',
  'Page header': 'page_header',
  'Page footer': 'page_footer',
  Other: 'other',
};

const typeOf = (stored: string | undefined) =>
  stored === undefined ? 'text' : (TYPE_BY_STORED[stored] ?? 'other');

/** A page's size is its first paragraph's, or the document-wide one records used to keep. */
const pagesOf = (layout: LegacyLayout, paragraphs: LegacyParagraph[]): Page[] => {
  const pages = new Map<number, Page>();
  paragraphs.forEach(paragraph => {
    const number = paragraph.page_number ?? 1;
    if (!pages.has(number)) {
      pages.set(number, {
        number,
        width: paragraph.page_width ?? layout.page_width ?? 0,
        height: paragraph.page_height ?? layout.page_height ?? 0,
      });
    }
  });
  return [...pages.values()];
};

const layoutOf = (layout: LegacyLayout | undefined) => {
  if (!layout) {
    return null;
  }
  const paragraphs = layout.paragraphs ?? [];
  return {
    pages: pagesOf(layout, paragraphs),
    segments: paragraphs.map(paragraph => ({
      left: paragraph.left ?? 0,
      top: paragraph.top ?? 0,
      width: paragraph.width ?? 0,
      height: paragraph.height ?? 0,
      pageNumber: paragraph.page_number ?? 1,
      text: paragraph.text ?? '',
      type: typeOf(paragraph.type),
    })),
  };
};

/**
 * Copies `segmentations` into `segmentations`. The layout moves from the snake_case shape the old
 * pipeline stored — one document-wide page size, the service's type names — to per-page sizes
 * and the module's own type names. `autoexpire`, the old claim TTL, has no column.
 */
export const SegmentationsMigrationConfig: MigrationConfig = {
  mongoCollection: 'segmentations',
  pgTable: 'segmentations',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      file_id: String(doc.fileID),
      filename: doc.filename,
      status: doc.status,
      attempt: (doc.attempt as number | undefined) ?? 0,
      requested_at: (doc.requestedAt as number | undefined) ?? null,
      xml_filename: (doc.xmlname as string | undefined) ?? null,
      failure_reason: (doc.failureReason as string | undefined) ?? null,
      layout: layoutOf(doc.segmentation as LegacyLayout | undefined),
    };
  },
};
