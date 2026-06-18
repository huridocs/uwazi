import { RelationshipMarker } from './types.js';
import { computePageClusterProximity } from './clusterProximity.js';

type RelationshipGroup =
  | {
      type: 'single';
      page: string;
      top: number;
      reference: RelationshipMarker;
    }
  | {
      type: 'cluster';
      page: string;
      top: number;
      references: RelationshipMarker[];
    };

type RelationshipGroups = RelationshipGroup[];

type PositionedRelationship = {
  reference: RelationshipMarker;
  page: string;
  top: number;
  bottom: number;
};

const PAGE_CLUSTER_PROXIMITY = 25;

const getPositionedRelationship = (marker: RelationshipMarker): PositionedRelationship | null => {
  const selection = marker.anchor?.selections?.[0];
  if (!selection || typeof selection.top !== 'number') {
    return null;
  }
  return {
    reference: marker,
    page: String(selection.page),
    top: selection.top,
    bottom: selection.top + selection.height,
  };
};

const splitMarkersByAnchor = (
  markers: RelationshipMarker[]
): { anchored: RelationshipMarker[]; entityLevel: RelationshipMarker[] } =>
  markers.reduce<{ anchored: RelationshipMarker[]; entityLevel: RelationshipMarker[] }>(
    (acc, marker) => {
      if (getPositionedRelationship(marker)) {
        acc.anchored.push(marker);
      } else {
        acc.entityLevel.push(marker);
      }
      return acc;
    },
    { anchored: [], entityLevel: [] }
  );

const appendRelationshipCluster = (
  grouped: RelationshipGroups,
  cluster: PositionedRelationship[]
): RelationshipGroups => {
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

type GroupRelationshipsOptions = {
  trackHeight?: number;
  pageHeight?: number;
};

const groupRelationships = (
  markers: RelationshipMarker[],
  options?: GroupRelationshipsOptions
): RelationshipGroups => {
  const proximity =
    options?.trackHeight && options?.pageHeight
      ? computePageClusterProximity(options.trackHeight, options.pageHeight)
      : PAGE_CLUSTER_PROXIMITY;

  const positioned = markers
    .map(getPositionedRelationship)
    .filter((item): item is PositionedRelationship => item !== null)
    .sort((a, b) => {
      const pageDiff = Number(a.page) - Number(b.page);
      return pageDiff !== 0 ? pageDiff : a.top - b.top;
    });

  if (!positioned.length) {
    return [];
  }

  const finalState = positioned.slice(1).reduce(
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
        grouped: appendRelationshipCluster(state.grouped, state.cluster),
        cluster: [current],
        clusterBottom: current.bottom,
      };
    },
    {
      grouped: [] as RelationshipGroups,
      cluster: [positioned[0]],
      clusterBottom: positioned[0].bottom,
    }
  );

  return appendRelationshipCluster(finalState.grouped, finalState.cluster);
};

export type { RelationshipGroup };
export { splitMarkersByAnchor, groupRelationships };
export type { DocumentRelationshipGroup } from './groupDocumentRelationships.js';
export { groupDocumentRelationships } from './groupDocumentRelationships.js';
