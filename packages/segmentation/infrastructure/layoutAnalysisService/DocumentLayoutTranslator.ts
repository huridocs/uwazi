import { MalformedSegmentationResult } from '../../application/errors/MalformedSegmentationResult.js';
import { DocumentLayout, LayoutPage } from '../../domain/DocumentLayout.js';
import { LayoutSegment } from '../../domain/LayoutSegment.js';
import { SegmentType } from '../../domain/SegmentType.js';
import { WireExtractionData, WireExtractionDataSchema, WireSegmentBox } from './wireTypes.js';

const TYPE_BY_WIRE: Record<string, SegmentType> = {
  Text: SegmentType.TEXT,
  Title: SegmentType.TITLE,
  'Section header': SegmentType.SECTION_HEADER,
  'List item': SegmentType.LIST_ITEM,
  Table: SegmentType.TABLE,
  Picture: SegmentType.PICTURE,
  Caption: SegmentType.CAPTION,
  Formula: SegmentType.FORMULA,
  Footnote: SegmentType.FOOTNOTE,
  'Page header': SegmentType.PAGE_HEADER,
  'Page footer': SegmentType.PAGE_FOOTER,
};

/**
 * The service's extraction data into a `DocumentLayout`. The service calls every region a
 * paragraph and sends a page size on each; a type it adds later becomes `OTHER`, a missing one
 * its default, text.
 */
class DocumentLayoutTranslator {
  static toDomain(payload: unknown): DocumentLayout {
    const parsed = WireExtractionDataSchema.safeParse(payload);
    if (!parsed.success) {
      throw new MalformedSegmentationResult('unexpected extraction data', parsed.error);
    }

    try {
      return new DocumentLayout({
        pages: DocumentLayoutTranslator.pagesOf(parsed.data),
        segments: parsed.data.paragraphs.map(DocumentLayoutTranslator.segmentOf),
      });
    } catch (error) {
      throw new MalformedSegmentationResult('the layout is not valid', error);
    }
  }

  private static segmentOf(box: WireSegmentBox): LayoutSegment {
    return new LayoutSegment({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      pageNumber: box.page_number,
      text: box.text ?? '',
      type:
        box.type === undefined ? SegmentType.TEXT : (TYPE_BY_WIRE[box.type] ?? SegmentType.OTHER),
    });
  }

  private static pagesOf(data: WireExtractionData): LayoutPage[] {
    const pages = new Map<number, LayoutPage>();
    data.paragraphs.forEach(box => {
      if (!pages.has(box.page_number)) {
        pages.set(box.page_number, {
          number: box.page_number,
          width: box.page_width ?? data.page_width,
          height: box.page_height ?? data.page_height,
        });
      }
    });
    return [...pages.values()];
  }
}

export { DocumentLayoutTranslator };
