import type { DocumentRelationshipGroup } from '../groupDocumentRelationships.js';
import {
  groupDocumentRelationships,
  groupRelationships,
  splitMarkersByAnchor,
} from '../groupRelationships.js';
import { mergeOverlappingRailGroups } from '../mergeOverlappingRailGroups.js';
import {
  CASELAW_TOTAL_PAGES,
  buildCaselawMarkers,
  makeMarker,
} from './fixtures/groupRelationshipsFixtures.js';

const LAYER_HEIGHT = 1000;
const TOTAL_PAGES = 880;

const makeGroup = (id: string, page: number, refCount = 1): DocumentRelationshipGroup => {
  const references = Array.from({ length: refCount }, (_, index) =>
    makeMarker(`${id}-${index}`, [{ page, top: 0, left: 0, width: 10, height: 10 }])
  );
  return {
    type: refCount > 1 ? 'cluster' : 'single',
    page,
    references,
    startPage: page,
    endPage: page,
  };
};

const idsOf = (group: DocumentRelationshipGroup): string[] =>
  group.references.map(reference => reference._id);

describe('mergeOverlappingRailGroups', () => {
  it('returns an empty array for empty input', () => {
    expect(mergeOverlappingRailGroups([], TOTAL_PAGES, LAYER_HEIGHT)).toEqual([]);
  });

  it('leaves groups unchanged when marker layer height is 0', () => {
    const groups = [makeGroup('a', 3), makeGroup('b', 4)];
    expect(mergeOverlappingRailGroups(groups, TOTAL_PAGES, 0)).toEqual(groups);
  });

  it('leaves non-overlapping groups unchanged', () => {
    const groups = [makeGroup('a', 1), makeGroup('b', 300), makeGroup('c', 700)];

    const result = mergeOverlappingRailGroups(groups, TOTAL_PAGES, LAYER_HEIGHT);

    expect(result).toHaveLength(3);
    expect(result.map(group => group.type)).toEqual(['single', 'single', 'single']);
    expect(result.flatMap(idsOf).sort()).toEqual(['a-0', 'b-0', 'c-0']);
  });

  it('merges two overlapping groups into a single cluster', () => {
    const groups = [makeGroup('a', 3), makeGroup('b', 4)];

    const result = mergeOverlappingRailGroups(groups, TOTAL_PAGES, LAYER_HEIGHT);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('cluster');
    expect(result[0].startPage).toBe(3);
    expect(result[0].endPage).toBe(4);
    expect(idsOf(result[0]).sort()).toEqual(['a-0', 'b-0']);
  });

  it('bipartitions a run of 3+ overlapping groups at the largest gap', () => {
    const groups = [makeGroup('a', 1), makeGroup('b', 8), makeGroup('c', 15), makeGroup('d', 17)];

    const result = mergeOverlappingRailGroups(groups, TOTAL_PAGES, LAYER_HEIGHT);

    expect(result).toHaveLength(2);
    expect(idsOf(result[0]).sort()).toEqual(['a-0', 'b-0']);
    expect(result[0].startPage).toBe(1);
    expect(result[0].endPage).toBe(8);
    expect(idsOf(result[1]).sort()).toEqual(['c-0', 'd-0']);
    expect(result[1].startPage).toBe(15);
    expect(result[1].endPage).toBe(17);
  });

  it('breaks a tie between equal gaps by choosing the more balanced ref-count split', () => {
    const groups = [
      makeGroup('a', 1),
      makeGroup('b', 8),
      makeGroup('c', 10),
      makeGroup('d', 17),
      makeGroup('e', 19),
    ];

    const result = mergeOverlappingRailGroups(groups, TOTAL_PAGES, LAYER_HEIGHT);

    expect(result).toHaveLength(2);
    expect(idsOf(result[0]).sort()).toEqual(['a-0', 'b-0', 'c-0']);
    expect(idsOf(result[1]).sort()).toEqual(['d-0', 'e-0']);
  });

  it('keeps Banjul Charter pages 8–10 separate after spatial merge at typical layer height', () => {
    const perPageGroups = groupRelationships(splitMarkersByAnchor(buildCaselawMarkers()).anchored, {
      trackHeight: 800,
    });
    const documentClusters = groupDocumentRelationships(perPageGroups, CASELAW_TOTAL_PAGES);
    const merged = mergeOverlappingRailGroups(documentClusters, CASELAW_TOTAL_PAGES, 800);

    expect(
      merged.find(cluster => cluster.startPage === 8 && cluster.endPage === 8)?.references
    ).toHaveLength(20);
    expect(
      merged.find(cluster => cluster.startPage === 9 && cluster.endPage === 9)?.references
    ).toHaveLength(5);
    const page10 = merged.find(cluster => cluster.startPage === 10 && cluster.endPage === 10);
    expect(page10?.type).toBe('single');
    expect(page10?.references).toHaveLength(1);
  });

  it('merges by center-based hitbox overlap when a larger cluster widens the threshold', () => {
    const singleGroups = [makeGroup('x', 1), makeGroup('y', 16)];
    const singleResult = mergeOverlappingRailGroups(singleGroups, TOTAL_PAGES, LAYER_HEIGHT);
    expect(singleResult).toHaveLength(2);

    const withClusterGroups = [makeGroup('x', 1, 20), makeGroup('y', 16)];
    const clusterResult = mergeOverlappingRailGroups(withClusterGroups, TOTAL_PAGES, LAYER_HEIGHT);
    expect(clusterResult).toHaveLength(1);
    expect(clusterResult[0].references).toHaveLength(21);
  });

  it('joins a run when a marker overlaps any run member, not only the last', () => {
    const groups = [
      makeGroup('hub', 50, 20),
      makeGroup('a', 52),
      makeGroup('b', 67),
      makeGroup('c', 84, 20),
    ];

    const result = mergeOverlappingRailGroups(groups, TOTAL_PAGES, LAYER_HEIGHT);

    expect(result).toHaveLength(2);
    expect(idsOf(result[0]).sort()).toEqual(
      [...Array.from({ length: 20 }, (_, index) => `hub-${index}`), 'a-0', 'b-0'].sort()
    );
    expect(idsOf(result[1]).sort()).toEqual(
      Array.from({ length: 20 }, (_, index) => `c-${index}`).sort()
    );
  });
});
