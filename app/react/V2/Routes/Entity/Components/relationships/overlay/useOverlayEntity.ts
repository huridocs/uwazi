import { useEffect, useLayoutEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import { getBySharedId } from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';

// Overlay shares EntityLoaderCache with the route loader (`${sharedId}:${locale}`).
// Any cached entity satisfies preview; partial fetches merge metadata without dropping relations.

type OverlayEntityState = {
  entity: Entity | undefined;
  loading: boolean;
  error: boolean;
};

type OverlayEntitySetters = {
  setEntity: (entity: Entity | undefined) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
};

const resetOverlayEntity = (setters: OverlayEntitySetters) => {
  setters.setEntity(undefined);
  setters.setLoading(false);
  setters.setError(false);
};

function fetchOverlayEntity(
  sharedId: string,
  language: string,
  setters: OverlayEntitySetters
): () => void {
  let cancelled = false;

  getBySharedId({ sharedId, language, omitRelationships: true })
    .then(([rows, fetchError]) => {
      if (cancelled) return;
      const fetched = rows?.[0];
      if (fetchError || !fetched?._id) {
        setters.setEntity(undefined);
        setters.setError(true);
      } else {
        entityLoaderCache.setEntity(sharedId, language, fetched);
        setters.setEntity(fetched);
        setters.setError(false);
      }
      setters.setLoading(false);
    })
    .catch(() => {
      if (cancelled) return;
      setters.setEntity(undefined);
      setters.setError(true);
      setters.setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}

function loadOverlayEntityForSharedId(
  sharedId: string,
  language: string,
  setters: OverlayEntitySetters
): (() => void) | undefined {
  setters.setEntity(undefined);
  setters.setLoading(true);
  setters.setError(false);

  const cached = entityLoaderCache.getEntity(sharedId, language);
  if (cached) {
    setters.setEntity(cached);
    setters.setLoading(false);
    return undefined;
  }

  return fetchOverlayEntity(sharedId, language, setters);
}

function loadOverlayEntity(
  sharedId: string | null,
  language: string,
  setters: OverlayEntitySetters
): (() => void) | undefined {
  if (!sharedId) {
    resetOverlayEntity(setters);
    return undefined;
  }

  return loadOverlayEntityForSharedId(sharedId, language, setters);
}

const entityMatchesRequest = (
  entity: Entity | undefined,
  sharedId: string | null,
  language: string
): entity is Entity =>
  Boolean(entity && sharedId && entity.sharedId === sharedId && entity.language === language);

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const useOverlayEntity = (sharedId: string | null): OverlayEntityState => {
  const language = useAtomValue(localeAtom);
  const [entity, setEntity] = useState<Entity | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const cancelLoad = loadOverlayEntity(sharedId, language, {
      setEntity,
      setLoading,
      setError,
    });
    return cancelLoad;
  }, [language, sharedId]);

  const resolvedEntity = entityMatchesRequest(entity, sharedId, language) ? entity : undefined;

  return {
    entity: resolvedEntity,
    loading: Boolean(sharedId) && !resolvedEntity && !error && loading,
    error,
  };
};

export { useOverlayEntity };
