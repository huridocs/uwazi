import type { RelationshipGroup } from './groupRelationships.js';
import type { RelationshipMarker } from './types.js';

type RelationshipGroups = RelationshipGroup[];

type DocumentRelationshipGroup = {
  type: 'single' | 'cluster';
  page: number;
  references: RelationshipMarker[];
  startPage: number;
  endPage: number;
};

type DocumentRelationshipGroups = DocumentRelationshipGroup[];

type PositionedGroup = {
  group: RelationshipGroup;
  page: number;
};

// Minimum number of pages to enable multi-page document clustering.
const DOCUMENT_MULTIPAGE_MIN_PAGES = 50;
// Minimum average references per page to enable multi-page document clustering.
const DOCUMENT_MULTIPAGE_MIN_REFS_PER_PAGE = 2;
// Document-level merge window as a fraction of total pages when multi-page clustering is enabled.
const DOCUMENT_CLUSTER_RATIO = 0.03;
// Minimum document-level merge window (in pages) when multi-page clustering is enabled.
const DOCUMENT_CLUSTER_MIN_PAGES = 1;
// Cap merged cluster size so dense adjacent pages stay separate on the rail.
const DOCUMENT_CLUSTER_MERGE_MAX_REFS = 50;

const getGroupReferences = (group: RelationshipGroup): RelationshipMarker[] =>
  group.type === 'cluster' ? group.references : [group.reference];

const toClusterGroup = (
  page: number,
  top: number,
  references: RelationshipMarker[]
): RelationshipGroup => ({
  type: 'cluster',
  page: String(page),
  top,
  references,
});

const appendDocumentCluster = (
  grouped: DocumentRelationshipGroups,
  cluster: PositionedGroup[]
): DocumentRelationshipGroups => {
  const references = cluster.flatMap(item => getGroupReferences(item.group));
  const pages = cluster.map(item => item.page);
  return [
    ...grouped,
    {
      type: references.length > 1 ? 'cluster' : 'single',
      page: cluster[0].page,
      references,
      startPage: Math.min(...pages),
      endPage: Math.max(...pages),
    },
  ];
};

const collapseToSingleGroupPerPage = (positionedGroups: PositionedGroup[]): PositionedGroup[] =>
  positionedGroups.reduce<PositionedGroup[]>((grouped, current) => {
    const last = grouped[grouped.length - 1];
    const currentReferences = getGroupReferences(current.group);
    if (last && last.page === current.page) {
      const merged: PositionedGroup = {
        page: current.page,
        group: toClusterGroup(current.page, last.group.top, [
          ...getGroupReferences(last.group),
          ...currentReferences,
        ]),
      };
      return [...grouped.slice(0, -1), merged];
    }
    return [
      ...grouped,
      {
        page: current.page,
        group: toClusterGroup(current.page, current.group.top, currentReferences),
      },
    ];
  }, []);

const countGrouped = (groups: RelationshipGroups): number =>
  groups.reduce((count, group) => count + getGroupReferences(group).length, 0);

const countClusterReferences = (cluster: PositionedGroup[]): number =>
  cluster.reduce((count, item) => count + getGroupReferences(item.group).length, 0);

const canMergeIntoCluster = (cluster: PositionedGroup[], current: PositionedGroup): boolean =>
  countClusterReferences(cluster) + getGroupReferences(current.group).length <=
  DOCUMENT_CLUSTER_MERGE_MAX_REFS;

const shouldAllowMultiPageClustering = (groups: RelationshipGroups, safePages: number): boolean => {
  const refsPerPage = countGrouped(groups) / safePages;
  return (
    safePages >= DOCUMENT_MULTIPAGE_MIN_PAGES && refsPerPage >= DOCUMENT_MULTIPAGE_MIN_REFS_PER_PAGE
  );
};

const groupDocumentRelationships = (
  perPageGroups: RelationshipGroups,
  totalPages: number = 1
): DocumentRelationshipGroups => {
  const safePages = Math.max(totalPages, 1);
  const allowMultiPageClustering = shouldAllowMultiPageClustering(perPageGroups, safePages);
  const positionedGroups = perPageGroups
    .map(group => {
      const parsedPage = Number.parseInt(group.page, 10);
      const page = Number.isNaN(parsedPage) ? 1 : parsedPage;
      return { group, page };
    })
    .sort((a, b) => {
      const pageDiff = a.page - b.page;
      return pageDiff !== 0 ? pageDiff : a.group.top - b.group.top;
    });

  const perPageGroupsOnly = collapseToSingleGroupPerPage(positionedGroups);

  if (!perPageGroupsOnly.length) {
    return [];
  }

  const thresholdPages = allowMultiPageClustering
    ? Math.max(DOCUMENT_CLUSTER_MIN_PAGES, Math.ceil(safePages * DOCUMENT_CLUSTER_RATIO))
    : DOCUMENT_CLUSTER_MIN_PAGES;

  const finalState = perPageGroupsOnly.slice(1).reduce(
    (state, current) => {
      if (
        current.page <= state.clusterEndPage + thresholdPages &&
        canMergeIntoCluster(state.cluster, current)
      ) {
        return {
          grouped: state.grouped,
          cluster: [...state.cluster, current],
          clusterEndPage: current.page,
        };
      }
      return {
        grouped: appendDocumentCluster(state.grouped, state.cluster),
        cluster: [current],
        clusterEndPage: current.page,
      };
    },
    {
      grouped: [] as DocumentRelationshipGroups,
      cluster: [perPageGroupsOnly[0]],
      clusterEndPage: perPageGroupsOnly[0].page,
    }
  );

  return appendDocumentCluster(finalState.grouped, finalState.cluster);
};

export type { DocumentRelationshipGroup };
export { groupDocumentRelationships };
