import { EntityReference } from '#V2/formatters/relationships/types.js';
import { computePageClusterProximity } from './computeClusterProximity.js';

type ReferenceGroup =
  | {
      type: 'single';
      page: string;
      top: number;
      reference: EntityReference;
    }
  | {
      type: 'cluster';
      page: string;
      top: number;
      references: EntityReference[];
    };

type ReferenceGroups = ReferenceGroup[];

type DocumentReferenceGroup = {
  type: 'single' | 'cluster';
  page: number;
  references: EntityReference[];
  startPage: number;
  endPage: number;
};

type DocumentReferenceGroups = DocumentReferenceGroup[];

type PositionedReference = {
  reference: EntityReference;
  page: string;
  top: number;
  bottom: number;
};

type PositionedGroup = {
  group: ReferenceGroup;
  page: number;
};

const getGroupReferences = (group: ReferenceGroup): EntityReference[] =>
  group.type === 'cluster' ? group.references : [group.reference];

const toClusterGroup = (
  page: number,
  top: number,
  references: EntityReference[]
): ReferenceGroup => ({
  type: 'cluster',
  page: String(page),
  top,
  references,
});

// Maximum vertical distance (in px) to merge references on the same page.
const PAGE_CLUSTER_PROXIMITY = 25;
// Minimum number of pages to enable multi-page document clustering.
const DOCUMENT_MULTIPAGE_MIN_PAGES = 50;
// Minimum average references per page to enable multi-page document clustering.
const DOCUMENT_MULTIPAGE_MIN_REFS_PER_PAGE = 2;
// Document-level merge window as a fraction of total pages when multi-page clustering is enabled.
const DOCUMENT_CLUSTER_RATIO = 0.03;
// Minimum document-level merge window (in pages) when multi-page clustering is enabled.
const DOCUMENT_CLUSTER_MIN_PAGES = 1;

const getPositionedReference = (reference: EntityReference): PositionedReference | null => {
  const firstRectangle = reference.reference.selectionRectangles?.[0];
  if (!firstRectangle?.page || typeof firstRectangle.top !== 'number') {
    return null;
  }
  return {
    reference,
    page: firstRectangle.page,
    top: firstRectangle.top,
    bottom:
      firstRectangle.top + (typeof firstRectangle.height === 'number' ? firstRectangle.height : 0),
  };
};

const appendReferenceCluster = (
  grouped: ReferenceGroups,
  cluster: PositionedReference[]
): ReferenceGroups => {
  const { page, top, reference } = cluster[0];
  if (cluster.length === 1) {
    return [...grouped, { type: 'single', page, top, reference }];
  }
  return [
    ...grouped,
    {
      type: 'cluster',
      page,
      top,
      references: cluster.map(item => item.reference),
    },
  ];
};

const appendDocumentCluster = (
  grouped: DocumentReferenceGroups,
  cluster: PositionedGroup[]
): DocumentReferenceGroups => {
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

const countGroupedReferences = (groups: ReferenceGroups): number =>
  groups.reduce((count, group) => count + getGroupReferences(group).length, 0);

const shouldAllowMultiPageClustering = (groups: ReferenceGroups, safePages: number): boolean => {
  const referencesPerPage = countGroupedReferences(groups) / safePages;
  return (
    safePages >= DOCUMENT_MULTIPAGE_MIN_PAGES &&
    referencesPerPage >= DOCUMENT_MULTIPAGE_MIN_REFS_PER_PAGE
  );
};

type GroupReferencesOptions = {
  trackHeight?: number;
  pageHeight?: number;
};

const groupReferences = (
  references: EntityReference[],
  options?: GroupReferencesOptions
): ReferenceGroups => {
  const proximity =
    options?.trackHeight && options?.pageHeight
      ? computePageClusterProximity(options.trackHeight, options.pageHeight)
      : PAGE_CLUSTER_PROXIMITY;
  const positionedReferences = references
    .map(getPositionedReference)
    .filter((item): item is PositionedReference => item !== null)
    .sort((a, b) => {
      const pageDiff = Number(a.page) - Number(b.page);
      return pageDiff !== 0 ? pageDiff : a.top - b.top;
    });

  if (!positionedReferences.length) {
    return [];
  }

  const finalState = positionedReferences.slice(1).reduce(
    (state, current) => {
      if (
        current.page === state.cluster[0].page &&
        current.top <= state.clusterBottom + proximity
      ) {
        return {
          grouped: state.grouped,
          cluster: [...state.cluster, current],
          clusterBottom: Math.max(state.clusterBottom, current.bottom),
        };
      }

      return {
        grouped: appendReferenceCluster(state.grouped, state.cluster),
        cluster: [current],
        clusterBottom: current.bottom,
      };
    },
    {
      grouped: [] as ReferenceGroups,
      cluster: [positionedReferences[0]],
      clusterBottom: positionedReferences[0].bottom,
    }
  );

  return appendReferenceCluster(finalState.grouped, finalState.cluster);
};

const groupDocumentReferences = (
  perPageGroups: ReferenceGroups,
  totalPages: number = 1
): DocumentReferenceGroups => {
  const safePages = Math.max(totalPages, 1);
  const allowMultiPageClustering = shouldAllowMultiPageClustering(perPageGroups, safePages);
  const positionedGroups = perPageGroups
    .map(group => {
      const parsedPage = Number.parseInt(group.page, 10);
      const page = Number.isNaN(parsedPage) ? 1 : parsedPage;

      return {
        group,
        page,
      };
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
    : 0;
  const finalState = perPageGroupsOnly.slice(1).reduce(
    (state, current) => {
      if (current.page <= state.clusterStartPage + thresholdPages) {
        return {
          grouped: state.grouped,
          cluster: [...state.cluster, current],
          clusterStartPage: state.clusterStartPage,
        };
      }

      return {
        grouped: appendDocumentCluster(state.grouped, state.cluster),
        cluster: [current],
        clusterStartPage: current.page,
      };
    },
    {
      grouped: [] as DocumentReferenceGroups,
      cluster: [perPageGroupsOnly[0]],
      clusterStartPage: perPageGroupsOnly[0].page,
    }
  );

  return appendDocumentCluster(finalState.grouped, finalState.cluster);
};

export type { DocumentReferenceGroup, ReferenceGroup };
export { groupReferences, groupDocumentReferences };
