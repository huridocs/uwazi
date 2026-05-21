import { EntityReference } from '#V2/formatters/relationships/types.js';

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
  position: number;
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

const DEFAULT_PROXIMITY_THRESHOLD = 48;

const toPositionedReference = (reference: EntityReference): PositionedReference | null => {
  const firstRectangle = reference.reference.selectionRectangles?.[0];

  if (!firstRectangle?.page || typeof firstRectangle.top !== 'number') {
    return null;
  }

  const height = typeof firstRectangle.height === 'number' ? firstRectangle.height : 0;

  return {
    reference,
    page: firstRectangle.page,
    top: firstRectangle.top,
    bottom: firstRectangle.top + height,
  };
};

const toSingleGroup = (page: string, positionedReference: PositionedReference): ReferenceGroup => ({
  type: 'single',
  page,
  top: positionedReference.top,
  reference: positionedReference.reference,
});

const toClusterGroup = (
  page: string,
  positionedReferences: PositionedReference[]
): ReferenceGroup => ({
  type: 'cluster',
  page,
  top: positionedReferences[0].top,
  references: positionedReferences.map(reference => reference.reference),
});

const pushCurrentCluster = (
  grouped: ReferenceGroup[],
  cluster: PositionedReference[]
): ReferenceGroup[] => {
  const page = cluster[0].reference.reference.selectionRectangles?.[0]?.page || '';

  if (cluster.length === 1) {
    return [...grouped, toSingleGroup(page, cluster[0])];
  }

  return [...grouped, toClusterGroup(page, cluster)];
};

const groupByProximity = (
  positionedReferences: PositionedReference[],
  proximityThreshold: number
): ReferenceGroup[] => {
  const sortedReferences = [...positionedReferences].sort((a, b) => {
    const pageDiff = Number(a.page) - Number(b.page);
    return pageDiff !== 0 ? pageDiff : a.top - b.top;
  });

  if (!sortedReferences.length) {
    return [];
  }

  let grouped: ReferenceGroup[] = [];
  let cluster = [sortedReferences[0]];
  let clusterBottom = sortedReferences[0].bottom;

  sortedReferences.slice(1).forEach(current => {
    const samePage = current.page === cluster[0].page;
    const shouldMerge = samePage && current.top <= clusterBottom + proximityThreshold;

    if (shouldMerge) {
      cluster = [...cluster, current];
      clusterBottom = Math.max(clusterBottom, current.bottom);
      return;
    }

    grouped = pushCurrentCluster(grouped, cluster);
    cluster = [current];
    clusterBottom = current.bottom;
  });

  return pushCurrentCluster(grouped, cluster);
};

const toPositionedReferences = (references: EntityReference[]): PositionedReference[] =>
  references.reduce<PositionedReference[]>((accumulator, reference) => {
    const positionedReference = toPositionedReference(reference);

    if (!positionedReference) {
      return accumulator;
    }

    return [...accumulator, positionedReference];
  }, []);

const groupReferences = (
  references: EntityReference[],
  proximityThreshold = DEFAULT_PROXIMITY_THRESHOLD
): ReferenceGroups => groupByProximity(toPositionedReferences(references), proximityThreshold);

const parsePage = (page: string) => {
  const parsedPage = Number.parseInt(page, 10);
  return Number.isNaN(parsedPage) ? 1 : parsedPage;
};

const toGroupReferences = (group: ReferenceGroup) =>
  group.type === 'cluster' ? group.references : [group.reference];

const toDocumentPosition = (group: ReferenceGroup, totalPages: number) => {
  const safePages = Math.max(totalPages, 1);
  const page = parsePage(group.page);
  const clampedTop = Math.max(group.top, 0);

  return (page - 1 + clampedTop / 1000) / safePages;
};

type PositionedGroup = {
  group: ReferenceGroup;
  position: number;
  page: number;
};

const toPositionedGroups = (
  perPageGroups: ReferenceGroups,
  totalPages: number
): PositionedGroup[] =>
  perPageGroups
    .map(group => ({
      group,
      position: toDocumentPosition(group, totalPages),
      page: parsePage(group.page),
    }))
    .sort((a, b) => a.position - b.position);

const toDocumentReferenceGroup = (cluster: PositionedGroup[]): DocumentReferenceGroup => {
  const references = cluster.flatMap(item => toGroupReferences(item.group));
  const pages = cluster.map(item => item.page);

  return {
    type: references.length > 1 ? 'cluster' : 'single',
    position: cluster[0].position,
    references,
    startPage: Math.min(...pages),
    endPage: Math.max(...pages),
  };
};

const groupDocumentReferences = (
  perPageGroups: ReferenceGroups,
  totalPages: number,
  proximityThreshold?: number
): DocumentReferenceGroups => {
  const threshold = proximityThreshold ?? 2 / Math.max(totalPages, 1);
  const positionedGroups = toPositionedGroups(perPageGroups, totalPages);

  if (!positionedGroups.length) {
    return [];
  }

  let grouped: DocumentReferenceGroups = [];
  let cluster = [positionedGroups[0]];
  let clusterEnd = positionedGroups[0].position;

  positionedGroups.slice(1).forEach(current => {
    const shouldMerge = current.position <= clusterEnd + threshold;

    if (shouldMerge) {
      cluster = [...cluster, current];
      clusterEnd = Math.max(clusterEnd, current.position);
      return;
    }

    grouped = [...grouped, toDocumentReferenceGroup(cluster)];

    cluster = [current];
    clusterEnd = current.position;
  });

  grouped = [...grouped, toDocumentReferenceGroup(cluster)];

  return grouped;
};

export { groupReferences };
export { groupDocumentReferences };
export type { ReferenceGroups, ReferenceGroup, DocumentReferenceGroups, DocumentReferenceGroup };
