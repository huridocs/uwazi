import type {
  RelationshipAnchorRow,
  RelationshipResolvedRow,
  RelationshipSummaryRow,
} from '#V2/api/relationships/types.js';
import { mergeRelationshipHubs } from '../mergeRelationshipHubs.js';

const summary: RelationshipSummaryRow[] = [
  {
    _id: 'self',
    hub: 'h1',
    entity: 'source',
    template: null,
    file: 'file1',
    entityData: { title: 'Source', template: 't1' },
  },
  {
    _id: 'target',
    hub: 'h1',
    entity: 'other',
    template: 'relA',
    entityData: { title: 'Other', template: 't2' },
  },
];

const firstRect = { top: 1, left: 2, width: 3, height: 4, page: '1' };
const secondRect = { top: 5, left: 6, width: 7, height: 8, page: '2' };

const anchors: RelationshipAnchorRow[] = [
  { _id: 'self', reference: { selectionRectangles: [firstRect] } },
];

const resolved: RelationshipResolvedRow[] = [
  {
    _id: 'self',
    reference: { text: 'quote', selectionRectangles: [firstRect, secondRect] },
  },
];

describe('mergeRelationshipHubs', () => {
  it('indexes summary by _id and keeps summary order', () => {
    expect(mergeRelationshipHubs(summary).map(row => row._id)).toEqual(['self', 'target']);
  });

  it('overlays the first anchor rectangle onto matching summary rows', () => {
    expect(mergeRelationshipHubs(summary, anchors)[0]?.reference).toEqual({
      selectionRectangles: [firstRect],
    });
  });

  it('lets resolved text and full rectangles win', () => {
    expect(mergeRelationshipHubs(summary, anchors, resolved)[0]?.reference).toEqual({
      text: 'quote',
      selectionRectangles: [firstRect, secondRect],
    });
  });

  it('drops anchors and resolved rows whose _id is not in summary', () => {
    const unknownAnchor: RelationshipAnchorRow[] = [
      { _id: 'missing', reference: { selectionRectangles: [firstRect] } },
    ];
    const unknownResolved: RelationshipResolvedRow[] = [
      { _id: 'missing', reference: { text: 'nope', selectionRectangles: [firstRect] } },
    ];

    expect(mergeRelationshipHubs(summary, unknownAnchor, unknownResolved)).toEqual(summary);
  });

  it('returns an empty list when summary is empty', () => {
    expect(mergeRelationshipHubs([], anchors, resolved)).toEqual([]);
  });
});
