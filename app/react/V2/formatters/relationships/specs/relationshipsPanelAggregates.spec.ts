import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { aggregateKey, deriveAggregates, listAggregates } from '../relationshipsPanelAggregates.js';

const marker = (id: string, target: string, type = 'relA'): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub: `hub-${id}`,
    type,
    from: { type: 'entity', entity: 'self1', entityTitle: 'Source', entityTemplateId: 'tpl1' },
    to: { type: 'entity', entity: target, entityTitle: target, entityTemplateId: 'tpl2' },
    relationTypeOnSelf: true,
  },
  target: { sharedId: target, title: target, templateId: 'tpl2' },
});

describe('relationshipsPanelAggregates', () => {
  it('builds a stable aggregate key', () => {
    expect(aggregateKey(marker('1', 'target1'))).toBe('target1::relA');
  });

  it('merges markers with the same target and relation type', () => {
    const aggregates = deriveAggregates([marker('1', 'target1'), marker('2', 'target1')], 'self1');
    expect(aggregates.size).toBe(1);
    expect(Array.from(aggregates.values())[0]?.markerIds).toEqual(['1', '2']);
  });

  it('lists aggregates as an array', () => {
    expect(listAggregates([marker('1', 'a'), marker('2', 'b')], 'self1')).toHaveLength(2);
  });
});
