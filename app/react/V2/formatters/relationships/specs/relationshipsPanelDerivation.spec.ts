import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { buildPanelListEntries } from '../relationshipsPanelDerivation.js';

const marker = (
  id: string,
  hub: string,
  targetSharedId: string,
  type = 'relA'
): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub,
    type,
    from: { type: 'entity', entity: 'self1', entityTitle: 'Source', entityTemplateId: 'tpl1' },
    to: {
      type: 'entity',
      entity: targetSharedId,
      entityTitle: targetSharedId,
      entityTemplateId: 'tpl2',
    },
    relationTypeOnSelf: true,
  },
  target: { sharedId: targetSharedId, title: targetSharedId, templateId: 'tpl2' },
});

describe('relationshipsPanelDerivation', () => {
  it('builds a reference entry for a single marker', () => {
    const entries = buildPanelListEntries([marker('1', 'h1', 'target1')], 'self1');
    expect(entries).toEqual([{ kind: 'reference', marker: marker('1', 'h1', 'target1') }]);
  });

  it('builds an aggregate entry for duplicate target and type', () => {
    const markers = [marker('1', 'h1', 'target1'), marker('2', 'h2', 'target1')];
    const entries = buildPanelListEntries(markers, 'self1');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe('aggregate');
    if (entries[0]?.kind === 'aggregate') {
      expect(entries[0].markers).toHaveLength(2);
      expect(entries[0].aggregate.markerIds).toEqual(['1', '2']);
    }
  });

  it('builds a hub entry when one hub connects to multiple targets', () => {
    const markers = [marker('1', 'hub-a', 'target1'), marker('2', 'hub-a', 'target2')];
    const entries = buildPanelListEntries(markers, 'self1');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe('hub');
    if (entries[0]?.kind === 'hub') {
      expect(entries[0].hub.members).toHaveLength(2);
      expect(entries[0].markers).toHaveLength(2);
    }
  });
});
