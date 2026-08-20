import { useCallback, useRef, useState } from 'react';
import type {
  RelationshipAnchorRow,
  RelationshipHubRow,
  RelationshipQueryPayload,
  RelationshipResolvedRow,
} from '#V2/api/relationships/types.js';
import { useServices } from '#V2/services/index.js';

const queryKey = (sharedId: string, language: string, fileId?: string) =>
  `${sharedId}:${language}:${fileId ?? ''}`;

const seedHubs = (seed: RelationshipQueryPayload | undefined, seedFits: boolean) =>
  seedFits && seed ? seed.hubRows : [];

const useQueryStore = (seed: RelationshipQueryPayload | undefined, currentKey: string) => {
  const seedFits = seed
    ? queryKey(seed.sharedId, seed.language, seed.fileId) === currentKey
    : false;
  const initialHubs = seedHubs(seed, seedFits);
  const { relationshipsQuery } = useServices();
  const [hubRows, setHubRows] = useState<RelationshipHubRow[]>(() => initialHubs);
  const [hasResolved, setHasResolved] = useState(false);
  const [resolving, setResolving] = useState(false);
  const hubRowsRef = useRef(initialHubs);
  const summaryBaseRef = useRef<RelationshipHubRow[]>(initialHubs);
  const anchorsOverlayRef = useRef<readonly RelationshipAnchorRow[] | undefined>(undefined);
  const resolvedOverlayRef = useRef<readonly RelationshipResolvedRow[] | undefined>(undefined);
  const summaryLoadedKey = useRef<string | null>(seedFits ? currentKey : null);
  const anchorsLoadedKey = useRef<string | null>(
    seedFits && seed?.anchorsLoaded ? currentKey : null
  );
  const resolvedKey = useRef<string | null>(null);
  const summaryInflight = useRef<Promise<RelationshipHubRow[] | undefined> | null>(null);
  const anchorsInflight = useRef<Promise<void> | null>(null);
  const resolvedInflight = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);
  hubRowsRef.current = hubRows;

  const publish = useCallback(
    (generation: number, nextSummary: RelationshipHubRow[]) => {
      if (generation !== generationRef.current) return;
      summaryBaseRef.current = nextSummary;
      const next = relationshipsQuery.compose(nextSummary, {
        ...(anchorsOverlayRef.current ? { anchors: anchorsOverlayRef.current } : {}),
        ...(resolvedOverlayRef.current ? { resolved: resolvedOverlayRef.current } : {}),
      });
      hubRowsRef.current = next;
      setHubRows(next);
    },
    [relationshipsQuery]
  );

  return {
    seedFits,
    hubRows,
    hasResolved,
    resolving,
    setHasResolved,
    setResolving,
    relationshipsQuery,
    summaryBaseRef,
    anchorsOverlayRef,
    resolvedOverlayRef,
    summaryLoadedKey,
    anchorsLoadedKey,
    resolvedKey,
    summaryInflight,
    anchorsInflight,
    resolvedInflight,
    generationRef,
    publish,
  };
};

export { queryKey, useQueryStore };
