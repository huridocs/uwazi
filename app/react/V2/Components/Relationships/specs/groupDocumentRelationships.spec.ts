import { groupDocumentRelationships } from '../groupDocumentRelationships.js';
import type { RelationshipGroup } from '../groupRelationships.js';
import { makeMarker } from './fixtures/groupRelationshipsFixtures.js';

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
  it('merges a singleton page into the previous cluster on short documents', () => {
    const groups = [singlePageGroup(9, ['a', 'b', 'c', 'd', 'e']), singlePageGroup(10, ['solo'])];

    const result = groupDocumentRelationships(groups, 18);

    expect(result).toHaveLength(1);
    expect(result[0].references).toHaveLength(6);
    expect(result[0].startPage).toBe(9);
    expect(result[0].endPage).toBe(10);
  });

  it('keeps dense adjacent pages separate when the merged cluster would be too large', () => {
    const densePageIds = Array.from({ length: 115 }, (_, index) => `p2-${index}`);
    const groups = [singlePageGroup(2, densePageIds), singlePageGroup(3, ['p3'])];

    const result = groupDocumentRelationships(groups, 18);

    expect(result).toHaveLength(2);
    expect(result[0].references).toHaveLength(115);
    expect(result[1].references).toHaveLength(1);
  });

  it('keeps single references on different pages as separate rail points', () => {
    const groups = [2, 3, 4, 5, 7].map(page => singlePageGroup(page, [`p${page}`]));

    const result = groupDocumentRelationships(groups, 12);

    expect(result).toHaveLength(5);
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

    expect(result.length).toBeGreaterThan(1);
    result.forEach(cluster => {
      expect(cluster.endPage - cluster.startPage).toBeLessThanOrEqual(3);
    });
  });

  it('extends clusters from the last merged page, not the cluster start page', () => {
    const groups = [
      singlePageGroup(
        8,
        Array.from({ length: 20 }, (_, index) => `p8-${index}`)
      ),
      singlePageGroup(9, ['a', 'b', 'c', 'd', 'e']),
      singlePageGroup(10, ['solo']),
    ];

    const result = groupDocumentRelationships(groups, 18);

    expect(result).toHaveLength(1);
    expect(result[0].references).toHaveLength(26);
    expect(result[0].startPage).toBe(8);
    expect(result[0].endPage).toBe(10);
  });
});
