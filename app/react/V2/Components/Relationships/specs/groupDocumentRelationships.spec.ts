import { groupDocumentRelationships } from '../groupDocumentRelationships.js';
import {
  groupRelationships,
  splitMarkersByAnchor,
  type RelationshipGroup,
} from '../groupRelationships.js';
import {
  CASELAW_TOTAL_PAGES,
  buildCaselawMarkers,
  makeMarker,
} from './fixtures/groupRelationshipsFixtures.js';

const singlePageGroup = (page: number, ids: string[]): RelationshipGroup => {
  const references = ids.map(id =>
    makeMarker(id, [{ page, top: 100, left: 0, width: 10, height: 10 }])
  );
  if (references.length === 1) {
    return { type: 'single', page: String(page), top: 100, reference: references[0] };
  }
  return { type: 'cluster', page: String(page), top: 100, references };
};

describe('groupDocumentRelationships', () => {
  it('keeps a singleton page separate from the previous cluster on short documents', () => {
    const groups = [singlePageGroup(9, ['a', 'b', 'c', 'd', 'e']), singlePageGroup(10, ['solo'])];

    const result = groupDocumentRelationships(groups, 18);

    expect(result).toHaveLength(2);
    expect(result[0].references).toHaveLength(5);
    expect(result[0].startPage).toBe(9);
    expect(result[0].endPage).toBe(9);
    expect(result[1].type).toBe('single');
    expect(result[1].startPage).toBe(10);
    expect(result[1].endPage).toBe(10);
  });

  it('keeps dense adjacent pages separate when the merged cluster would be too large', () => {
    const densePageIds = Array.from({ length: 115 }, (_, index) => `p2-${index}`);
    const groups = [singlePageGroup(2, densePageIds), singlePageGroup(3, ['p3'])];

    const result = groupDocumentRelationships(groups, 50);

    expect(result).toHaveLength(2);
    expect(result[0].references).toHaveLength(115);
    expect(result[1].references).toHaveLength(1);
  });

  it('keeps nearby single-page references separate on short documents', () => {
    const groups = [2, 3, 4].map(page => singlePageGroup(page, [`p${page}`]));

    const result = groupDocumentRelationships(groups, 12);

    expect(result).toHaveLength(3);
    result.forEach((cluster, index) => {
      expect(cluster.type).toBe('single');
      expect(cluster.references).toHaveLength(1);
      expect(cluster.startPage).toBe(index + 2);
      expect(cluster.endPage).toBe(index + 2);
    });
  });

  it('merges nearby pages when multi-page clustering is enabled', () => {
    const groups = [
      ...[2, 3, 4].map(page => singlePageGroup(page, [`p${page}-a`, `p${page}-b`])),
      singlePageGroup(
        40,
        Array.from({ length: 100 }, (_, index) => `pad-${index}`)
      ),
    ];

    const result = groupDocumentRelationships(groups, 50);

    const nearbyCluster = result.find(cluster => cluster.startPage === 2 && cluster.endPage === 4);
    expect(nearbyCluster).toBeDefined();
    expect(nearbyCluster?.type).toBe('cluster');
    expect(nearbyCluster?.references).toHaveLength(6);
  });

  it('keeps single references separate when pages are outside the merge window', () => {
    const groups = [2, 5, 8].map(page => singlePageGroup(page, [`p${page}`]));

    const result = groupDocumentRelationships(groups, 12);

    expect(result).toHaveLength(3);
    result.forEach(cluster => {
      expect(cluster.type).toBe('single');
      expect(cluster.references).toHaveLength(1);
    });
  });

  it('keeps references distributed across a short document in separate clusters', () => {
    const groups = Array.from({ length: 12 }, (_, index) =>
      singlePageGroup(index + 1, [`p${index + 1}-a`, `p${index + 1}-b`, `p${index + 1}-c`])
    );

    const result = groupDocumentRelationships(groups, 12);

    expect(result).toHaveLength(12);
    result.forEach((cluster, index) => {
      expect(cluster.startPage).toBe(index + 1);
      expect(cluster.endPage).toBe(index + 1);
      expect(cluster.references).toHaveLength(3);
    });
  });

  // eslint-disable-next-line max-statements
  it('keeps adjacent pages separate on short documents instead of extending clusters', () => {
    const groups = [
      singlePageGroup(
        8,
        Array.from({ length: 20 }, (_, index) => `p8-${index}`)
      ),
      singlePageGroup(9, ['a', 'b', 'c', 'd', 'e']),
      singlePageGroup(10, ['solo']),
    ];

    const result = groupDocumentRelationships(groups, 18);

    expect(result).toHaveLength(3);
    expect(result[0].startPage).toBe(8);
    expect(result[0].endPage).toBe(8);
    expect(result[0].references).toHaveLength(20);
    expect(result[1].startPage).toBe(9);
    expect(result[1].endPage).toBe(9);
    expect(result[1].references).toHaveLength(5);
    expect(result[2].type).toBe('single');
    expect(result[2].startPage).toBe(10);
    expect(result[2].endPage).toBe(10);
  });

  // eslint-disable-next-line max-statements
  it('keeps Banjul Charter short-doc pages separate through the full grouping pipeline', () => {
    const perPageGroups = groupRelationships(splitMarkersByAnchor(buildCaselawMarkers()).anchored, {
      trackHeight: 800,
    });
    const result = groupDocumentRelationships(perPageGroups, CASELAW_TOTAL_PAGES);

    const page8 = result.find(cluster => cluster.startPage === 8 && cluster.endPage === 8);
    const page9 = result.find(cluster => cluster.startPage === 9 && cluster.endPage === 9);
    const page10 = result.find(cluster => cluster.startPage === 10 && cluster.endPage === 10);
    const page12 = result.find(
      cluster =>
        cluster.startPage === 12 &&
        cluster.endPage === 12 &&
        cluster.references.filter(marker => marker._id.startsWith('caselaw-p12-')).length === 5
    );

    expect(page8?.references).toHaveLength(20);
    expect(page9?.references).toHaveLength(5);
    expect(page10?.type).toBe('single');
    expect(page10?.references).toHaveLength(1);
    expect(page10?.references[0]._id).toBe('caselaw-p10-r0');
    expect(page12).toBeDefined();
    expect(
      result.find(cluster => cluster.startPage === 8 && cluster.endPage === 10)
    ).toBeUndefined();
  });
});
