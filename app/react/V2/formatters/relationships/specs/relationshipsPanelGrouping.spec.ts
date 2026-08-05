import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  describeGroupLabel,
  groupMarkers,
  type GroupLabelContext,
} from '../relationshipsPanelGrouping.js';

const context: GroupLabelContext = {
  selfSharedId: 'self1',
  selfTitle: 'Source Entity',
  selfTemplateId: 'tpl-source',
  relationshipTypeName: id => (id === 'relA' ? 'Type A' : id),
  templateName: id => (id === 'tpl-target' ? 'Target Template' : 'Unknown template'),
  templateColor: () => '#00aa00',
};

const marker = (
  id: string,
  overrides: Partial<RelationshipMarker> & {
    targetSharedId?: string;
    type?: string;
    page?: number;
  } = {}
): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub: overrides.view?.hub ?? `hub-${id}`,
    type: overrides.type ?? 'relA',
    from: {
      type: 'entity',
      entity: 'self1',
      entityTitle: 'Source',
      entityTemplateId: 'tpl-source',
    },
    to: {
      type: 'entity',
      entity: overrides.targetSharedId ?? 'target1',
      entityTitle: 'Target One',
      entityTemplateId: 'tpl-target',
    },
    relationTypeOnSelf: true,
  },
  target: {
    sharedId: overrides.targetSharedId ?? 'target1',
    title: 'Target One',
    templateId: 'tpl-target',
  },
  anchor:
    overrides.page === undefined
      ? undefined
      : {
          type: 'textReference',
          entity: 'self1',
          entityTitle: 'Source',
          entityTemplateId: 'tpl-source',
          file: 'f1',
          text: 'snippet',
          selections: [{ page: overrides.page, top: 0, left: 0, width: 1, height: 1 }],
        },
  ...overrides,
});

describe('relationshipsPanelGrouping', () => {
  it('groups markers by relation type', () => {
    const markers = [
      marker('1', { type: 'relA' }),
      marker('2', { type: 'relB' }),
      marker('3', { type: 'relA' }),
    ];
    const groups = groupMarkers(markers, 'relation-type', context);
    expect(groups).toHaveLength(2);
    expect(groups.find(([key]) => key === 'relA')?.[1]).toHaveLength(2);
  });

  it('groups markers by target entity', () => {
    const markers = [
      marker('1', { targetSharedId: 'a' }),
      marker('2', { targetSharedId: 'b' }),
      marker('3', { targetSharedId: 'a' }),
    ];
    const groups = groupMarkers(markers, 'target-entity', context);
    expect(groups.find(([key]) => key === 'a')?.[1]).toHaveLength(2);
  });

  it('pins no-page bucket to the bottom on source-page grouping', () => {
    const markers = [marker('1', { page: 2 }), marker('2'), marker('3', { page: 1 })];
    const groups = groupMarkers(markers, 'source-page', context);
    expect(groups[groups.length - 1]?.[0]).toBe('no-page');
  });

  it('describes translatable group labels', () => {
    expect(describeGroupLabel('incoming', 'direction', context, [])).toEqual({
      kind: 'translate',
      key: 'Incoming',
    });
    expect(describeGroupLabel('no-page', 'source-page', context, [])).toEqual({
      kind: 'translate',
      key: 'No page',
    });
  });
});
