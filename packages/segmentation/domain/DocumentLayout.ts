import { InvalidDocumentLayout } from './errors/InvalidDocumentLayout.js';
import { LayoutSegment } from './LayoutSegment.js';

type LayoutPage = {
  number: number;
  width: number;
  height: number;
};

type DocumentLayoutProps = {
  pages: LayoutPage[];
  segments: LayoutSegment[];
};

/**
 * The result of segmenting a PDF. Page sizes are kept per page, since a document may mix sizes,
 * and every segment has to sit on one of the layout's pages.
 */
class DocumentLayout {
  readonly pages: readonly LayoutPage[];

  readonly segments: readonly LayoutSegment[];

  constructor(props: DocumentLayoutProps) {
    props.pages.forEach(page => DocumentLayout.assertValidPage(page));
    DocumentLayout.assertUniquePages(props.pages);
    DocumentLayout.assertSegmentsOnKnownPages(props.pages, props.segments);

    this.pages = [...props.pages];
    this.segments = [...props.segments];
  }

  page(number: number): LayoutPage | undefined {
    return this.pages.find(page => page.number === number);
  }

  private static assertValidPage(page: LayoutPage) {
    if (!Number.isInteger(page.number) || page.number < 1) {
      throw new InvalidDocumentLayout(`page number ${page.number} is not a page`);
    }
    if (page.width < 0 || page.height < 0) {
      throw new InvalidDocumentLayout(`page ${page.number} has negative dimensions`);
    }
  }

  private static assertUniquePages(pages: LayoutPage[]) {
    const numbers = new Set(pages.map(page => page.number));
    if (numbers.size !== pages.length) {
      throw new InvalidDocumentLayout('page numbers must be unique');
    }
  }

  private static assertSegmentsOnKnownPages(pages: LayoutPage[], segments: LayoutSegment[]) {
    const numbers = new Set(pages.map(page => page.number));
    const orphan = segments.find(segment => !numbers.has(segment.pageNumber));
    if (orphan) {
      throw new InvalidDocumentLayout(
        `a segment is on page ${orphan.pageNumber}, which is not in the layout`
      );
    }
  }
}

export { DocumentLayout };
export type { DocumentLayoutProps, LayoutPage };
