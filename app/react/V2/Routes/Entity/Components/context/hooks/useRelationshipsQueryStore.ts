import { useCallback, useEffect } from 'react';
import type { RelationshipHubRow, RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import { queryKey, useQueryStore } from './useQueryStore.js';

type UseRelationshipsQueryStoreParams = {
  seed?: RelationshipQueryPayload;
  sharedId: string;
  language: string;
  fileId?: string;
};

const useRelationshipsQueryStore = ({
  seed,
  sharedId,
  language,
  fileId,
}: UseRelationshipsQueryStoreParams) => {
  const currentKey = queryKey(sharedId, language, fileId);
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
      const [rows, error] = await relationshipsQuery.loadSummary(sharedId, { language });
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
    generationRef,
    language,
    publish,
    relationshipsQuery,
    sharedId,
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
    if (!fileId || anchorsLoadedKey.current === currentKey) return;
    if (anchorsInflight.current) {
      await anchorsInflight.current;
      return;
    }

    const generation = generationRef.current;
    const request = (async () => {
      const [hubs, [anchors, error]] = await Promise.all([
        fetchSummary(),
        relationshipsQuery.loadAnchors(sharedId, { language, fileId }),
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
    fetchSummary,
    fileId,
    generationRef,
    language,
    publish,
    relationshipsQuery,
    sharedId,
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
      const [resolved, error] = await relationshipsQuery.loadResolved(sharedId, { language });
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
    generationRef,
    language,
    publish,
    relationshipsQuery,
    resolvedInflight,
    resolvedKey,
    resolvedOverlayRef,
    setHasResolved,
    setResolving,
    sharedId,
    summaryBaseRef,
  ]);

  return {
    hubRows,
    hasResolved,
    resolving,
    relationshipsQuery,
    ensureAnchors,
    ensureResolved,
  };
};

export { useRelationshipsQueryStore };
