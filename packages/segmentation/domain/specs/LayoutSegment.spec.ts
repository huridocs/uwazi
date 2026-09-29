import { LayoutSegment } from '../LayoutSegment.js';
import { SegmentType } from '../SegmentType.js';
import { InvalidDocumentLayout } from '../errors/InvalidDocumentLayout.js';

const props = {
  left: 10,
  top: 20,
  width: 100,
  height: 12,
  pageNumber: 1,
  text: 'Hello',
  type: SegmentType.TITLE,
};

describe('LayoutSegment', () => {
  it('should hold its box, page, text and type', () => {
    expect(new LayoutSegment(props)).toMatchObject(props);
  });

  it.each([
    ['a zero page number', { pageNumber: 0 }],
    ['a fractional page number', { pageNumber: 1.5 }],
    ['a negative width', { width: -1 }],
    ['a negative height', { height: -1 }],
  ])('should reject %s', (_case, overrides) => {
    expect(() => new LayoutSegment({ ...props, ...overrides })).toThrow(InvalidDocumentLayout);
  });
});
