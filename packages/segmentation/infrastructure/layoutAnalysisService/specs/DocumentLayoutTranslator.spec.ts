import { SegmentType } from '../../../domain/SegmentType.js';
import { MalformedSegmentationResult } from '../../../application/errors/MalformedSegmentationResult.js';
import { DocumentLayoutTranslator } from '../DocumentLayoutTranslator.js';

const box = (overrides: Record<string, unknown> = {}) => ({
  left: 10,
  top: 20,
  width: 100,
  height: 12,
  page_number: 1,
  page_width: 612,
  page_height: 792,
  text: 'Hello',
  type: 'Text',
  ...overrides,
});

const extraction = (paragraphs: unknown[], overrides: Record<string, unknown> = {}) => ({
  tenant: 'tenant',
  file_name: 'file.pdf',
  page_width: 612,
  page_height: 792,
  paragraphs,
  ...overrides,
});

describe('DocumentLayoutTranslator', () => {
  it('should translate boxes into segments in the module vocabulary', () => {
    const layout = DocumentLayoutTranslator.toDomain(extraction([box()]));

    expect(layout.segments.map(s => ({ ...s }))).toEqual([
      {
        left: 10,
        top: 20,
        width: 100,
        height: 12,
        pageNumber: 1,
        text: 'Hello',
        type: SegmentType.TEXT,
      },
    ]);
  });

  it.each([
    ['Text', SegmentType.TEXT],
    ['Title', SegmentType.TITLE],
    ['Section header', SegmentType.SECTION_HEADER],
    ['List item', SegmentType.LIST_ITEM],
    ['Table', SegmentType.TABLE],
    ['Picture', SegmentType.PICTURE],
    ['Caption', SegmentType.CAPTION],
    ['Formula', SegmentType.FORMULA],
    ['Footnote', SegmentType.FOOTNOTE],
    ['Page header', SegmentType.PAGE_HEADER],
    ['Page footer', SegmentType.PAGE_FOOTER],
    ['Something new', SegmentType.OTHER],
  ])('should translate the "%s" type', (wire, type) => {
    expect(
      DocumentLayoutTranslator.toDomain(extraction([box({ type: wire })])).segments[0].type
    ).toBe(type);
  });

  it('should default a box without type or text to empty text', () => {
    const { type, text, ...bare } = box();

    expect(DocumentLayoutTranslator.toDomain(extraction([bare])).segments[0]).toMatchObject({
      type: SegmentType.TEXT,
      text: '',
    });
  });

  it('should keep each page its own size', () => {
    const layout = DocumentLayoutTranslator.toDomain(
      extraction([
        box(),
        box({ page_number: 2, page_width: 842, page_height: 595 }),
        box({ page_number: 2, page_width: 842, page_height: 595 }),
      ])
    );

    expect(layout.pages).toEqual([
      { number: 1, width: 612, height: 792 },
      { number: 2, width: 842, height: 595 },
    ]);
  });

  it('should fall back to the document-wide size for boxes without one', () => {
    const { page_width, page_height, ...unsized } = box();

    expect(
      DocumentLayoutTranslator.toDomain(
        extraction([unsized], { page_width: 500, page_height: 700 })
      ).pages
    ).toEqual([{ number: 1, width: 500, height: 700 }]);
  });

  it('should translate a document without boxes', () => {
    expect(
      DocumentLayoutTranslator.toDomain(extraction([], { page_width: 0, page_height: 0 }))
    ).toMatchObject({
      pages: [],
      segments: [],
    });
  });

  it.each([
    ['a payload that is not an object', 'nope'],
    [
      'a payload without paragraphs',
      { tenant: 't', file_name: 'f', page_width: 1, page_height: 1 },
    ],
    ['a box without coordinates', extraction([{ page_number: 1 }])],
    ['a box on page zero', extraction([box({ page_number: 0 })])],
    ['a box with a negative width', extraction([box({ width: -1 })])],
  ])('should reject %s as malformed', (_case, payload) => {
    expect(() => DocumentLayoutTranslator.toDomain(payload)).toThrow(MalformedSegmentationResult);
  });
});
