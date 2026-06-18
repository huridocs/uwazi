import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { computeFacetCounts } from '../relationshipsPanelFacets.js';

const marker = (id: string, type: string, templateId: string): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub: `h-${id}`,
    type,
    from: { type: 'entity', entity: 'self1', entityTitle: 'Source', entityTemplateId: 'tpl1' },
    to: { type: 'entity', entity: 't1', entityTitle: 'Target', entityTemplateId: templateId },
    relationTypeOnSelf: true,
  },
  target: { sharedId: 't1', title: 'Target', templateId },
});

describe('relationshipsPanelFacets', () => {
  it('counts relation types and entity types', () => {
    const counts = computeFacetCounts([
      marker('1', 'relA', 'tpl2'),
      marker('2', 'relA', 'tpl3'),
      marker('3', 'relB', 'tpl2'),
    ]);
    expect(counts.total).toBe(3);
    expect(counts.byRelType).toEqual([
      ['relA', 2],
      ['relB', 1],
    ]);
    expect(counts.byEntityType).toEqual([
      ['tpl2', 2],
      ['tpl3', 1],
    ]);
  });
});
