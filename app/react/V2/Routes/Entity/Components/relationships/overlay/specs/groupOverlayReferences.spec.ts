import {
  groupOverlayReferences,
  limitReferenceGroups,
  OVERLAY_REFERENCES_VISIBLE_LIMIT,
  type OverlayReferenceRow,
} from '../groupOverlayReferences.js';

const row = (id: string, sourceSharedId: string, title: string): OverlayReferenceRow => ({
  markerId: id,
  relationshipTypeName: id,
  display: {
    referenceText: '',
    referencePage: undefined,
    sourceSharedId,
    sourceEntity: { templateId: 'tmpl', title },
  },
});

describe('groupOverlayReferences', () => {
  it('groups rows by source entity preserving order', () => {
    const groups = groupOverlayReferences([
      row('a', 'src-1', 'Source A'),
      row('b', 'src-1', 'Source A'),
      row('c', 'src-2', 'Source B'),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].sourceSharedId).toBe('src-1');
    expect(groups[0].items.map(item => item.markerId)).toEqual(['a', 'b']);
    expect(groups[1].sourceSharedId).toBe('src-2');
    expect(groups[1].items.map(item => item.markerId)).toEqual(['c']);
  });

  it('limits visible items across groups', () => {
    const groups = groupOverlayReferences([
      row('1', 'src-1', 'Source A'),
      row('2', 'src-1', 'Source A'),
      row('3', 'src-2', 'Source B'),
      row('4', 'src-2', 'Source B'),
      row('5', 'src-2', 'Source B'),
      row('6', 'src-3', 'Source C'),
      row('7', 'src-3', 'Source C'),
      row('8', 'src-4', 'Source D'),
      row('9', 'src-4', 'Source D'),
      row('10', 'src-4', 'Source D'),
      row('11', 'src-5', 'Source E'),
    ]);

    expect(limitReferenceGroups(groups, OVERLAY_REFERENCES_VISIBLE_LIMIT)).toEqual([
      {
        sourceSharedId: 'src-1',
        sourceEntity: { templateId: 'tmpl', title: 'Source A' },
        items: [row('1', 'src-1', 'Source A'), row('2', 'src-1', 'Source A')],
      },
      {
        sourceSharedId: 'src-2',
        sourceEntity: { templateId: 'tmpl', title: 'Source B' },
        items: [
          row('3', 'src-2', 'Source B'),
          row('4', 'src-2', 'Source B'),
          row('5', 'src-2', 'Source B'),
        ],
      },
      {
        sourceSharedId: 'src-3',
        sourceEntity: { templateId: 'tmpl', title: 'Source C' },
        items: [row('6', 'src-3', 'Source C'), row('7', 'src-3', 'Source C')],
      },
      {
        sourceSharedId: 'src-4',
        sourceEntity: { templateId: 'tmpl', title: 'Source D' },
        items: [
          row('8', 'src-4', 'Source D'),
          row('9', 'src-4', 'Source D'),
          row('10', 'src-4', 'Source D'),
        ],
      },
    ]);
  });
});
