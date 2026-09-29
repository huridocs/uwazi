import { DocumentLayout } from '../DocumentLayout.js';
import { LayoutSegment } from '../LayoutSegment.js';
import { SegmentType } from '../SegmentType.js';
import { InvalidDocumentLayout } from '../errors/InvalidDocumentLayout.js';

const segment = (overrides: Partial<ConstructorParameters<typeof LayoutSegment>[0]> = {}) =>
  new LayoutSegment({
    left: 10,
    top: 20,
    width: 100,
    height: 12,
    pageNumber: 1,
    text: 'Hello',
    type: SegmentType.TEXT,
    ...overrides,
  });

describe('DocumentLayout', () => {
  it('should hold pages and segments', () => {
    const layout = new DocumentLayout({
      pages: [
        { number: 1, width: 612, height: 792 },
        { number: 2, width: 842, height: 595 },
      ],
      segments: [segment(), segment({ pageNumber: 2, type: SegmentType.TABLE })],
    });

    expect(layout.pages).toHaveLength(2);
    expect(layout.segments.map(s => s.type)).toEqual([SegmentType.TEXT, SegmentType.TABLE]);
    expect(layout.page(2)).toEqual({ number: 2, width: 842, height: 595 });
  });

  it('should allow a document with no segments', () => {
    expect(new DocumentLayout({ pages: [], segments: [] }).segments).toEqual([]);
  });

  it('should reject a segment on a page the layout does not have', () => {
    expect(
      () =>
        new DocumentLayout({
          pages: [{ number: 1, width: 612, height: 792 }],
          segments: [segment({ pageNumber: 2 })],
        })
    ).toThrow(InvalidDocumentLayout);
  });

  it('should reject duplicated page numbers', () => {
    expect(
      () =>
        new DocumentLayout({
          pages: [
            { number: 1, width: 612, height: 792 },
            { number: 1, width: 612, height: 792 },
          ],
          segments: [],
        })
    ).toThrow(InvalidDocumentLayout);
  });

  it.each([
    ['a zero page number', { number: 0, width: 612, height: 792 }],
    ['a fractional page number', { number: 1.5, width: 612, height: 792 }],
    ['a negative width', { number: 1, width: -1, height: 792 }],
    ['a negative height', { number: 1, width: 612, height: -1 }],
  ])('should reject a page with %s', (_case, page) => {
    expect(() => new DocumentLayout({ pages: [page], segments: [] })).toThrow(
      InvalidDocumentLayout
    );
  });
});
