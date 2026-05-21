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

type PositionedGroup = {
  group: ReferenceGroup;
  page: number;
  position: number;
};

const DEFAULT_PROXIMITY_THRESHOLD = 48;

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
  const references = cluster.flatMap(item =>
    item.group.type === 'cluster' ? item.group.references : [item.group.reference]
  );
  const pages = cluster.map(item => item.page);

  return [
    ...grouped,
    {
      type: references.length > 1 ? 'cluster' : 'single',
      position: cluster[0].position,
      references,
      startPage: Math.min(...pages),
      endPage: Math.max(...pages),
    },
  ];
};

const groupReferences = (references: EntityReference[]): ReferenceGroups => {
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
        current.top <= state.clusterBottom + DEFAULT_PROXIMITY_THRESHOLD
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
  const positionedGroups = perPageGroups
    .map(group => {
      const parsedPage = Number.parseInt(group.page, 10);
      const page = Number.isNaN(parsedPage) ? 1 : parsedPage;

      return {
        group,
        page,
        position: (page - 1 + Math.max(group.top, 0) / 1000) / safePages,
      };
    })
    .sort((a, b) => a.position - b.position);

  if (!positionedGroups.length) {
    return [];
  }

  const threshold = 2 / safePages;
  const finalState = positionedGroups.slice(1).reduce(
    (state, current) => {
      if (current.position <= state.clusterEnd + threshold) {
        return {
          grouped: state.grouped,
          cluster: [...state.cluster, current],
          clusterEnd: Math.max(state.clusterEnd, current.position),
        };
      }

      return {
        grouped: appendDocumentCluster(state.grouped, state.cluster),
        cluster: [current],
        clusterEnd: current.position,
      };
    },
    {
      grouped: [] as DocumentReferenceGroups,
      cluster: [positionedGroups[0]],
      clusterEnd: positionedGroups[0].position,
    }
  );

  return appendDocumentCluster(finalState.grouped, finalState.cluster);
};

export { groupReferences, groupDocumentReferences };
