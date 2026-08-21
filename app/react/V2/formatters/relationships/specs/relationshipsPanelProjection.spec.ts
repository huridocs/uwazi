import type { RelationshipHubRow } from '#V2/api/relationships/types.js';
import { formatRelationships } from '../formatRelationships.js';
import {
  computeStats,
  countEntityRelationships,
  filterAndSortMarkers,
  filterMarkersForDocument,
  projectRelationshipsPanel,
} from '../relationshipsPanelProjection.js';

const rows: RelationshipHubRow[] = [
  {
    template: 'relA',
    _id: 'c1',
    hub: 'h1',
    file: 'f1',
    entity: 'self1',
    entityData: { title: 'Source', template: 't1' },
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
    entityData: { title: 'Source', template: 't1' },
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
];

const entityLevelRows: RelationshipHubRow[] = [
  ...rows,
  {
    template: 'relC',
    _id: 'c5',
    hub: 'h3',
    entity: 'self1',
    entityData: { title: 'Source', template: 't1' },
  },
  {
    template: null,
    _id: 'c6',
    hub: 'h3',
    entity: 'target2',
    entityData: { title: 'Other', template: 't2' },
  },
];

const multiFileRows: RelationshipHubRow[] = [
  ...rows,
  {
    template: 'relC',
    _id: 'c5',
    hub: 'h3',
    file: 'f2',
    entity: 'self1',
    entityData: { title: 'Source', template: 't1' },
    reference: {
      text: 'other file',
      selectionRectangles: [{ top: 1, left: 0, width: 10, height: 10, page: '1' }],
    },
  },
  {
    template: 'relD',
    _id: 'c7',
    hub: 'h4',
    entity: 'self1',
    entityData: { title: 'Source', template: 't1' },
  },
  {
    template: null,
    _id: 'c8',
    hub: 'h4',
    entity: 'target3',
    entityData: { title: 'Entity level', template: 't2' },
  },
];

const relationshipsOf = (hubRows: readonly RelationshipHubRow[]) =>
  formatRelationships('self1', hubRows);

const project = (hubRows: readonly RelationshipHubRow[]) =>
  projectRelationshipsPanel('self1', relationshipsOf(hubRows));

describe('relationshipsPanelProjection', () => {
  it('projects markers and stats from hub rows', () => {
    const { markers, stats } = project(rows);
    expect(markers).toHaveLength(2);
    expect(stats).toEqual({ references: 2, entities: 1, aggregates: 2 });
  });

  it('computes stats for a marker subset', () => {
    const { markers } = project(rows);
    expect(computeStats(markers.slice(0, 1), 'self1')).toEqual({
      references: 1,
      entities: 1,
      aggregates: 1,
    });
  });

  it('counts all filtered markers as references', () => {
    const { stats } = project(entityLevelRows);
    expect(stats).toEqual({ references: 3, entities: 2, aggregates: 3 });
  });

  it('counts relationships scoped to a document', () => {
    const countRows: RelationshipHubRow[] = [
      ...rows,
      {
        template: 'relC',
        _id: 'c5',
        hub: 'h3',
        file: 'f2',
        entity: 'self1',
        entityData: { title: 'Source', template: 't1' },
        reference: {
          text: 'other file',
          selectionRectangles: [{ top: 1, left: 0, width: 10, height: 10, page: '1' }],
        },
      },
      {
        template: null,
        _id: 'c6',
        hub: 'h3',
        entity: 'target2',
        entityData: { title: 'Other', template: 't2' },
      },
    ];
    expect(countEntityRelationships('self1', relationshipsOf(countRows))).toBe(3);
    expect(countEntityRelationships('self1', relationshipsOf(countRows), 'f1')).toBe(2);
  });
});

describe('relationshipsPanelProjection filters', () => {
  it('filters markers by search query', () => {
    const { markers } = project(rows);
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
    const { markers } = project(rows);
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
    const { markers } = project(entityLevelRows);
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

  it('filters markers by relation type facet', () => {
    const { markers } = project(rows);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: '',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: id => (id === 'relA' ? 'Type A' : 'Type B'),
      relTypeFilters: { relA: true },
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.relationship.type).toBe('relA');
  });

  it('filters markers by active cluster ids', () => {
    const { markers } = project(rows);
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
    const { markers } = project(rows);
    const filtered = filterAndSortMarkers(markers, {
      searchQuery: 'alpha NOT beta',
      sortOrder: 'none',
      selfSharedId: 'self1',
      relationshipTypeName: () => '',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.anchor?.text).toContain('alpha');
  });

  it('filters markers for active document (entity-level + matching file)', () => {
    const { markers } = project(multiFileRows);
    const filtered = filterMarkersForDocument(markers, 'f1', 'self1');
    expect(filtered.map(m => m._id).sort()).toEqual(['c2', 'c4', 'c8']);
  });
});
