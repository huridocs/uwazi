import {
  groupDocumentRelationships,
  groupRelationships,
  splitMarkersByAnchor,
} from '../groupRelationships.js';
import { railMarkerZIndex } from '../markerMetrics.js';
import { makeMarker } from './fixtures/groupRelationshipsFixtures.js';

const CASELAW_SHARED_ID = '4ut5ec9am2g';
const CASELAW_TOTAL_PAGES = 18;

const CASELAW_PAGE_REF_COUNTS: Record<number, number> = {
  2: 115,
  3: 592,
  4: 132,
  5: 224,
  6: 61,
  7: 48,
  8: 20,
  9: 5,
  10: 1,
  12: 5,
  13: 2,
  14: 7,
  15: 72,
  16: 11,
};

const buildCaselawMarkers = () =>
  Object.entries(CASELAW_PAGE_REF_COUNTS).flatMap(([page, count]) =>
    Array.from({ length: count }, (_, index) =>
      makeMarker(`caselaw-p${page}-r${index}`, [
        { page: Number(page), top: 100 + index * 2, left: 0, width: 10, height: 10 },
      ])
    )
  );

describe(`caselaw Banjul Charter rail (${CASELAW_SHARED_ID})`, () => {
  const markers = buildCaselawMarkers();
  const perPageGroups = groupRelationships(splitMarkersByAnchor(markers).anchored, {
    trackHeight: 800,
  });
  const documentClusters = groupDocumentRelationships(perPageGroups, CASELAW_TOTAL_PAGES);

  it('merges the page-10 singleton into the page-9 cluster instead of a separate rail dot', () => {
    const page10Singleton = documentClusters.find(
      cluster => cluster.type === 'single' && cluster.startPage === 10
    );
    expect(page10Singleton).toBeUndefined();

    const page8to10Cluster = documentClusters.find(
      cluster => cluster.startPage === 8 && cluster.endPage === 10
    );
    expect(page8to10Cluster).toBeDefined();
    expect(page8to10Cluster?.references).toHaveLength(26);
    expect(page8to10Cluster?.references.some(marker => marker._id === 'caselaw-p10-r0')).toBe(
      true
    );
    expect(page8to10Cluster?.references.filter(marker => marker._id.startsWith('caselaw-p9-'))).toHaveLength(5);
  });

  it('keeps the page-12 cluster of five separate from the page-8–10 cluster', () => {
    const page8to10 = documentClusters.find(
      cluster => cluster.startPage === 8 && cluster.endPage === 10
    );
    const page12Cluster = documentClusters.find(
      cluster =>
        cluster.startPage === 12 &&
        cluster.references.filter(marker => marker._id.startsWith('caselaw-p12-')).length === 5
    );

    expect(page8to10?.references).toHaveLength(26);
    expect(page12Cluster).toBeDefined();
    expect(page12Cluster?.references.filter(marker => marker._id.startsWith('caselaw-p12-'))).toHaveLength(5);
  });

  it('stacks later overlapping markers above earlier clusters on the rail', () => {
    const stackOrders = documentClusters.map((_, index) => index + 1);
    stackOrders.forEach((stackOrder, index) => {
      if (index === 0) return;
      const earlierCluster = railMarkerZIndex(stackOrders[index - 1], 'cluster');
      const laterPoint = railMarkerZIndex(stackOrder, 'point');
      expect(laterPoint).toBeGreaterThan(earlierCluster);
    });
  });
});
