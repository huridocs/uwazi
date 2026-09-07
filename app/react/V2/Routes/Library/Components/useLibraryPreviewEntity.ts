import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { localeAtom } from '#V2/atoms/index.js';
import { useServices } from '#V2/services/index.js';

type LibraryPreviewEntityState = {
  entity: Entity | undefined;
  loading: boolean;
  error: boolean;
};

const pickEntity = (rows: Entity[] | undefined, language: string): Entity | undefined =>
  rows?.find(row => row.language === language) ?? rows?.[0];

const useLibraryPreviewEntity = (sharedId: string): LibraryPreviewEntityState => {
  const { entities } = useServices();
  const language = useAtomValue(localeAtom);
  const getBySharedId = entities.getBySharedId;
  const [entity, setEntity] = useState<Entity | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEntity(undefined);
    setLoading(true);
    setError(false);

    getBySharedId(sharedId, { language, omitRelationships: false })
      .then(([rows, fetchError]) => {
        if (cancelled) return;
        const fetched = pickEntity(rows, language);
        if (fetchError || !fetched?._id) {
          setEntity(undefined);
          setError(true);
        } else {
          setEntity(fetched);
          setError(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEntity(undefined);
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [getBySharedId, language, sharedId]);

  const matchesRequest = Boolean(entity && entity.sharedId === sharedId);

  return {
    entity: matchesRequest ? entity : undefined,
    loading: !matchesRequest && !error && loading,
    error,
  };
};

export { useLibraryPreviewEntity };
