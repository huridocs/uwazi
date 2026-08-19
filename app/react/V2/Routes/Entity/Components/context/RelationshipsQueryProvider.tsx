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
  RelationshipSummaryRow,
} from '#V2/api/relationships/types.js';
import { mergeRelationshipHubs } from '#V2/formatters/relationships/mergeRelationshipHubs.js';
import { useServices } from '#V2/services/index.js';
import { useEntityScopedEntity } from './EntityContext.js';
import { useEntityLanguage } from './EntityLanguageContext.js';

type RelationshipQueryStatus = {
  resolved: boolean;
  resolving: boolean;
};

type RelationshipsQueryState = {
  hubRows: RelationshipHubRow[];
  status: RelationshipQueryStatus;
  ensureResolved: () => Promise<void>;
};

const RelationshipsQueryContext = createContext<RelationshipsQueryState | null>(null);

const queryKey = (sharedId: string, language: string, fileId?: string) =>
  `${sharedId}:${language}:${fileId ?? ''}`;

type RelationshipsQueryProviderProps = {
  seed?: RelationshipQueryPayload;
  children: React.ReactNode;
};

const RelationshipsQueryProvider = ({ seed, children }: RelationshipsQueryProviderProps) => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const { relationshipsQuery } = useServices();
  const currentKey = queryKey(entity.sharedId, language, mainDocument?._id);
  const seedFits = seed
    ? queryKey(seed.sharedId, seed.language, seed.fileId) === currentKey
    : false;

  const [summary, setSummary] = useState<RelationshipSummaryRow[]>(() =>
    seedFits && seed ? seed.summary : []
  );
  const [anchors, setAnchors] = useState<RelationshipAnchorRow[]>(() =>
    seedFits && seed ? seed.anchors : []
  );
  const [resolved, setResolved] = useState<RelationshipResolvedRow[]>([]);
  const [hasResolved, setHasResolved] = useState(false);
  const [resolving, setResolving] = useState(false);
  const resolvedKey = useRef<string | null>(null);
  const resolvedInflight = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    generationRef.current += 1;
    resolvedKey.current = null;
    resolvedInflight.current = null;
    setResolved([]);
    setHasResolved(false);
    setResolving(false);

    if (seedFits && seed) {
      setSummary(seed.summary);
      setAnchors(seed.anchors);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      const [nextSummary, summaryError] = await relationshipsQuery.getSummary(entity.sharedId, {
        language,
      });
      const [nextAnchors, anchorsError] = await (mainDocument?._id
        ? relationshipsQuery.getAnchors(entity.sharedId, mainDocument._id, { language })
        : Promise.resolve<[RelationshipAnchorRow[]]>([[]]));
      if (cancelled || summaryError || anchorsError) return;
      setSummary(nextSummary ?? []);
      setAnchors(nextAnchors ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    currentKey,
    entity.sharedId,
    language,
    mainDocument?._id,
    relationshipsQuery,
    seed,
    seedFits,
  ]);

  const ensureResolved = useCallback(() => {
    if (resolvedKey.current === currentKey) return Promise.resolve();
    if (resolvedInflight.current) return resolvedInflight.current;

    const generation = generationRef.current;
    setResolving(true);
    const request = (async () => {
      const [rows, error] = await relationshipsQuery.getResolved(entity.sharedId, { language });
      if (generation !== generationRef.current) return;
      if (error) return;
      setResolved(rows ?? []);
      resolvedKey.current = currentKey;
      setHasResolved(true);
    })().finally(() => {
      if (resolvedInflight.current === request) {
        resolvedInflight.current = null;
      }
      if (generation === generationRef.current) {
        setResolving(false);
      }
    });
    resolvedInflight.current = request;
    return request;
  }, [currentKey, entity.sharedId, language, relationshipsQuery]);

  const hubRows = useMemo(
    () => mergeRelationshipHubs(summary, anchors, resolved),
    [anchors, resolved, summary]
  );

  const status = useMemo(() => ({ resolved: hasResolved, resolving }), [hasResolved, resolving]);

  const value = useMemo(
    () => ({ hubRows, status, ensureResolved }),
    [ensureResolved, hubRows, status]
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

const useRelationshipHubRows = () => useRelationshipsQuery().hubRows;
const useRelationshipQueryStatus = () => useRelationshipsQuery().status;
const useEnsureResolved = () => useRelationshipsQuery().ensureResolved;

export {
  RelationshipsQueryProvider,
  useRelationshipHubRows,
  useRelationshipQueryStatus,
  useEnsureResolved,
};
