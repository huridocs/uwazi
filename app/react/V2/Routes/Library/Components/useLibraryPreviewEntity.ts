import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { localeAtom } from '#V2/atoms/index.js';
import { useServices } from '#V2/services/index.js';

type LibraryPreviewEntityState = {
  entity: Entity | undefined;
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
};

type PreviewFetchResult = {
  entity?: Entity;
  error: boolean;
};

const pickEntity = (rows: Entity[] | undefined, language: string): Entity | undefined =>
  rows?.find(row => row.language === language) ?? rows?.[0];

const toPreviewResult = (
  rows: Entity[] | undefined,
  fetchError: unknown,
  language: string
): PreviewFetchResult => {
  const fetched = pickEntity(rows, language);
  if (fetchError || !fetched?._id) {
    return { error: true };
  }
  return { entity: fetched, error: false };
};

const useLibraryPreviewEntity = (sharedId: string): LibraryPreviewEntityState => {
  const { entities } = useServices();
  const language = useAtomValue(localeAtom);
  const { getBySharedId } = entities;
  const [entity, setEntity] = useState<Entity | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const applyResult = useCallback((result: PreviewFetchResult, silent: boolean) => {
    if (result.error) {
      if (!silent) {
        setEntity(undefined);
        setError(true);
        setLoading(false);
      }
      return;
    }
    setEntity(result.entity);
    setError(false);
    setLoading(false);
  }, []);

  const fetchEntity = useCallback(
    async (targetSharedId: string, silent: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      if (!silent) {
        setEntity(undefined);
        setLoading(true);
        setError(false);
      }

      try {
        const [rows, fetchError] = await getBySharedId(targetSharedId, {
          language,
          omitRelationships: false,
        });
        if (requestId !== requestIdRef.current) return;
        applyResult(toPreviewResult(rows, fetchError, language), silent);
      } catch {
        if (requestId !== requestIdRef.current) return;
        applyResult({ error: true }, silent);
      }
    },
    [applyResult, getBySharedId, language]
  );

  useEffect(() => {
    fetchEntity(sharedId, false).catch(() => undefined);
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchEntity, sharedId]);

  const reload = useCallback(async () => fetchEntity(sharedId, true), [fetchEntity, sharedId]);
  const matchesRequest = Boolean(entity && entity.sharedId === sharedId);

  return {
    entity: matchesRequest ? entity : undefined,
    loading: !matchesRequest && !error && loading,
    error,
    reload,
  };
};

export { useLibraryPreviewEntity };
