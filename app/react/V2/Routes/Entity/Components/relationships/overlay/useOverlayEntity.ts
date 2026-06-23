import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import { getBySharedId } from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';

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
  setters.setLoading(true);
  setters.setError(false);

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

function loadOverlayEntity(
  sharedId: string | null,
  language: string,
  setters: OverlayEntitySetters
): (() => void) | undefined {
  if (!sharedId) {
    resetOverlayEntity(setters);
    return undefined;
  }

  const cached = entityLoaderCache.getEntity(sharedId, language);
  if (cached) {
    setters.setEntity(cached);
    setters.setLoading(false);
    setters.setError(false);
    return undefined;
  }

  return fetchOverlayEntity(sharedId, language, setters);
}

const useOverlayEntity = (sharedId: string | null): OverlayEntityState => {
  const language = useAtomValue(localeAtom);
  const [entity, setEntity] = useState<Entity | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => loadOverlayEntity(sharedId, language, { setEntity, setLoading, setError }),
    [language, sharedId]
  );

  return { entity, loading, error };
};

export { useOverlayEntity };
