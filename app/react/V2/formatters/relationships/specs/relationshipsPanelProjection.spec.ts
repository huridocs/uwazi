import { Relationship } from '#api/relationships.v2/model/Relationship.js';
import { Entity } from '#V2/api/entities/types.js';
import {
  computeStats,
  filterAndSortMarkers,
  projectRelationshipsPanel,
} from '../relationshipsPanelProjection.js';

const entity = {
  _id: 'entity1',
  sharedId: 'self1',
  language: 'en',
  title: 'Source',
  template: 't1',
  creationDate: 1,
  user: 'user1',
  relations: [
    {
      template: 'relA',
      _id: 'c1',
      hub: 'h1',
      file: 'f1',
      entity: 'self1',
      reference: {
        text: 'alpha snippet',
        selectionRectangles: [{ top: 50, left: 0, width: 10, height: 10, page: '2' }],
      },
    },
    {
      template: null,
      _id: 'c2',
      hub: 'h1',
      entity: 'target1',
      entityData: { title: 'Zebra', template: 't2' },
    },
    {
      template: 'relB',
      _id: 'c3',
      hub: 'h2',
      file: 'f1',
      entity: 'self1',
      reference: {
        text: 'beta snippet',
        selectionRectangles: [{ top: 10, left: 0, width: 10, height: 10, page: '1' }],
      },
    },
    {
      template: null,
      _id: 'c4',
      hub: 'h2',
      entity: 'target1',
      entityData: { title: 'Zebra', template: 't2' },
    },
  ],
} as Entity;

describe('relationshipsPanelProjection', () => {
  it('projects markers and stats from entity relations', () => {
    const { markers, stats } = projectRelationshipsPanel(entity);
    expect(markers).toHaveLength(2);
    expect(stats).toEqual({ references: 2, entities: 1, aggregates: 2 });
  });

  it('filters markers by search query', () => {
    const { markers } = projectRelationshipsPanel(entity);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: 'alpha',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.anchor?.text).toContain('alpha');
  });

  it('sorts markers by appearance (page then top)', () => {
    const { markers } = projectRelationshipsPanel(entity);
    const sorted = filterAndSortMarkers(markers, {
      searchQuery: '',
      sortOrder: 'appearance',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
    });
    expect(sorted[0]?.anchor?.selections?.[0]?.page).toBe(1);
    expect(sorted[1]?.anchor?.selections?.[0]?.page).toBe(2);
  });

  it('sorts text-anchored markers before entity-level on appearance sort', () => {
    const withEntityLevel = {
      ...entity,
      relations: [
        ...((entity.relations ?? []) as Relationship[]),
        {
          template: 'relC',
          _id: 'c5',
          hub: 'h3',
          entity: 'self1',
        },
        {
          template: null,
          _id: 'c6',
          hub: 'h3',
          entity: 'target2',
          entityData: { title: 'Other', template: 't2' },
        },
      ],
    } as Entity;
    const { markers } = projectRelationshipsPanel(withEntityLevel);
    const sorted = filterAndSortMarkers(markers, {
      searchQuery: '',
      sortOrder: 'appearance',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
    });
    const firstUnanchored = sorted.findIndex(marker => !marker.anchor);
    expect(firstUnanchored).toBeGreaterThan(0);
    expect(sorted.slice(0, firstUnanchored).every(marker => marker.anchor)).toBe(true);
  });

  it('computes stats for a marker subset', () => {
    const { markers } = projectRelationshipsPanel(entity);
    expect(computeStats(markers.slice(0, 1), 'self1')).toEqual({
      references: 1,
      entities: 1,
      aggregates: 1,
    });
  });

  it('counts all filtered markers as references', () => {
    const withEntityLevel = {
      ...entity,
      relations: [
        ...((entity.relations ?? []) as Relationship[]),
        {
          template: 'relC',
          _id: 'c5',
          hub: 'h3',
          entity: 'self1',
        },
        {
          template: null,
          _id: 'c6',
          hub: 'h3',
          entity: 'target2',
          entityData: { title: 'Other', template: 't2' },
        },
      ],
    } as Entity;
    const { stats } = projectRelationshipsPanel(withEntityLevel);
    expect(stats).toEqual({ references: 3, entities: 2, aggregates: 3 });
  });

  it('filters markers by relation type facet', () => {
    const { markers } = projectRelationshipsPanel(entity);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: '',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: id => (id === 'relA' ? 'Type A' : 'Type B'),
      relTypeFilters: { relA: true },
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.view.type).toBe('relA');
  });

  it('filters markers by active cluster ids', () => {
    const { markers } = projectRelationshipsPanel(entity);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: '',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
      activeClusterRefIds: [markers[0]?._id ?? ''],
    });
    expect(filtered).toHaveLength(1);
  });

  it('filters markers with boolean search', () => {
    const { markers } = projectRelationshipsPanel(entity);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: 'alpha NOT beta',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.anchor?.text).toContain('alpha');
  });
});
