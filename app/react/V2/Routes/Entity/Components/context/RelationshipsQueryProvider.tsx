import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  RelationshipAnchorRow,
  RelationshipHubRow,
  RelationshipQueryPayload,
  RelationshipResolvedRow,
} from '#V2/api/relationships/types.js';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import { useServices } from '#V2/services/index.js';
import { useEntityScopedEntity } from './EntityContext.js';
import { useEntityLanguage } from './EntityLanguageContext.js';

type RelationshipQueryStatus = {
  resolved: boolean;
  resolving: boolean;
};

type RelationshipsQueryState = {
  views: RelationshipView[];
  status: RelationshipQueryStatus;
  ensureAnchors: () => Promise<void>;
  ensureResolved: () => Promise<void>;
};

const RelationshipsQueryContext = createContext<RelationshipsQueryState | null>(null);

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

type RelationshipsQueryProviderProps = {
  seed?: RelationshipQueryPayload;
  children: React.ReactNode;
};

const RelationshipsQueryProvider = ({ seed, children }: RelationshipsQueryProviderProps) => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const currentKey = queryKey(entity.sharedId, language, mainDocument?._id);
  const store = useQueryStore(seed, currentKey);
  const {
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
  } = store;

  const fetchSummary = useCallback(async (): Promise<RelationshipHubRow[] | undefined> => {
    if (summaryLoadedKey.current === currentKey) return summaryBaseRef.current;
    if (summaryInflight.current) return summaryInflight.current;

    const generation = generationRef.current;
    const request = (async () => {
      const [rows, error] = await relationshipsQuery.loadSummary(entity.sharedId, { language });
      if (generation !== generationRef.current) return undefined;
      if (error) return undefined;
      const hubs = rows ?? [];
      summaryLoadedKey.current = currentKey;
      publish(generation, hubs);
      return hubs;
    })();
    summaryInflight.current = request;
    try {
      return await request;
    } finally {
      if (summaryInflight.current === request) {
        summaryInflight.current = null;
      }
    }
  }, [
    currentKey,
    entity.sharedId,
    generationRef,
    language,
    publish,
    relationshipsQuery,
    summaryBaseRef,
    summaryInflight,
    summaryLoadedKey,
  ]);

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    resolvedKey.current = null;
    summaryInflight.current = null;
    anchorsInflight.current = null;
    resolvedInflight.current = null;
    anchorsOverlayRef.current = undefined;
    resolvedOverlayRef.current = undefined;
    setHasResolved(false);
    setResolving(false);

    if (seedFits && seed) {
      summaryLoadedKey.current = currentKey;
      anchorsLoadedKey.current = seed.anchorsLoaded ? currentKey : null;
      publish(generation, seed.hubRows);
      return undefined;
    }

    summaryLoadedKey.current = null;
    anchorsLoadedKey.current = null;
    publish(generation, []);
    fetchSummary().catch(() => undefined);
    return undefined;
  }, [
    anchorsInflight,
    anchorsLoadedKey,
    anchorsOverlayRef,
    currentKey,
    fetchSummary,
    generationRef,
    publish,
    resolvedInflight,
    resolvedKey,
    resolvedOverlayRef,
    seed,
    seedFits,
    setHasResolved,
    setResolving,
    summaryInflight,
    summaryLoadedKey,
  ]);

  const ensureAnchors = useCallback(async () => {
    const fileId = mainDocument?._id;
    if (!fileId || anchorsLoadedKey.current === currentKey) return;
    if (anchorsInflight.current) {
      await anchorsInflight.current;
      return;
    }

    const generation = generationRef.current;
    const request = (async () => {
      const [hubs, [anchors, error]] = await Promise.all([
        fetchSummary(),
        relationshipsQuery.loadAnchors(entity.sharedId, { language, fileId }),
      ]);
      if (generation !== generationRef.current) return;
      if (error || hubs === undefined) return;
      anchorsOverlayRef.current = anchors ?? [];
      anchorsLoadedKey.current = currentKey;
      publish(generation, hubs);
    })();
    anchorsInflight.current = request;
    try {
      await request;
    } finally {
      if (anchorsInflight.current === request) {
        anchorsInflight.current = null;
      }
    }
  }, [
    anchorsInflight,
    anchorsLoadedKey,
    anchorsOverlayRef,
    currentKey,
    entity.sharedId,
    fetchSummary,
    generationRef,
    language,
    mainDocument?._id,
    publish,
    relationshipsQuery,
  ]);

  const ensureResolved = useCallback(async () => {
    if (resolvedKey.current === currentKey) return;
    if (resolvedInflight.current) {
      await resolvedInflight.current;
      return;
    }

    const generation = generationRef.current;
    setResolving(true);
    const request = (async () => {
      const [resolved, error] = await relationshipsQuery.loadResolved(entity.sharedId, {
        language,
      });
      if (generation !== generationRef.current) return;
      if (error) return;
      resolvedOverlayRef.current = resolved ?? [];
      resolvedKey.current = currentKey;
      setHasResolved(true);
      publish(generation, summaryBaseRef.current);
    })().finally(() => {
      if (resolvedInflight.current === request) {
        resolvedInflight.current = null;
      }
      if (generation === generationRef.current) {
        setResolving(false);
      }
    });
    resolvedInflight.current = request;
    await request;
  }, [
    currentKey,
    entity.sharedId,
    generationRef,
    language,
    publish,
    relationshipsQuery,
    resolvedInflight,
    resolvedKey,
    resolvedOverlayRef,
    setHasResolved,
    setResolving,
    summaryBaseRef,
  ]);

  const views = useMemo(
    () => relationshipsQuery.toViews(entity.sharedId, hubRows),
    [entity.sharedId, hubRows, relationshipsQuery]
  );

  const status = useMemo(() => ({ resolved: hasResolved, resolving }), [hasResolved, resolving]);

  const value = useMemo(
    () => ({ views, status, ensureAnchors, ensureResolved }),
    [ensureAnchors, ensureResolved, status, views]
  );

  return (
    <RelationshipsQueryContext.Provider value={value}>
      {children}
    </RelationshipsQueryContext.Provider>
  );
};

const useRelationshipsQuery = () => {
  const context = useContext(RelationshipsQueryContext);
  if (!context) {
    throw new Error('Relationships query context not found');
  }
  return context;
};

const useRelationshipViews = () => useRelationshipsQuery().views;
const useRelationshipQueryStatus = () => useRelationshipsQuery().status;
const useEnsureAnchors = () => useRelationshipsQuery().ensureAnchors;
const useEnsureResolved = () => useRelationshipsQuery().ensureResolved;

export {
  RelationshipsQueryProvider,
  useRelationshipViews,
  useRelationshipQueryStatus,
  useEnsureAnchors,
  useEnsureResolved,
};
