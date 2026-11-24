import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import type { Entity } from '#V2/api/entities/types.js';
import { bucketIsFinished } from './libraryCreatePendingTranslations.js';
import {
  libraryEntityRevisionAtom,
  localeAtom,
  type LibraryEntityRevision,
} from '#V2/atoms/index.js';
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

type PreviewState = {
  entity?: Entity;
  loading: boolean;
  error: boolean;
};

const loadPreviewEntity = async (
  getBySharedId: ReturnType<typeof useServices>['entities']['getBySharedId'],
  targetSharedId: string,
  language: string
): Promise<PreviewFetchResult> => {
  try {
    const [rows, fetchError] = await getBySharedId(targetSharedId, {
      language,
      omitRelationships: false,
    });
    return toPreviewResult(rows, fetchError, language);
  } catch {
    return { error: true };
  }
};

const withRecordedTranslations = (
  entity: Entity | undefined,
  sharedId: string,
  recorded: LibraryEntityRevision | undefined
) => {
  if (!entity || entity.sharedId !== sharedId) return undefined;
  if (recorded?.sharedId !== sharedId) return entity;
  const translations: EntityTranslationsDTO = { ...recorded.translations };
  Object.entries(entity.translations ?? {}).forEach(([language, bucket]) => {
    translations[language] = bucketIsFinished(bucket)
      ? bucket
      : (recorded.translations[language] ?? bucket);
  });
  return { ...entity, translations };
};

const useLibraryPreviewEntity = (sharedId: string): LibraryPreviewEntityState => {
  const { entities } = useServices();
  const language = useAtomValue(localeAtom);
  const recorded = useAtomValue(libraryEntityRevisionAtom);
  const [state, setState] = useState<PreviewState>({ loading: true, error: false });
  const requestIdRef = useRef(0);

  const fetchEntity = useCallback(
    async (targetSharedId: string, silent: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setState(current => (silent ? current : { loading: true, error: false }));
      const result = await loadPreviewEntity(entities.getBySharedId, targetSharedId, language);
      if (requestId !== requestIdRef.current) return;
      setState(current => {
        if (!result.error) return { entity: result.entity, loading: false, error: false };
        if (silent && current.entity)
          return { entity: current.entity, loading: false, error: false };
        return { loading: false, error: true };
      });
    },
    [entities.getBySharedId, language]
  );

  useEffect(() => {
    fetchEntity(sharedId, false).catch(() => undefined);
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchEntity, sharedId]);

  const reload = useCallback(async () => fetchEntity(sharedId, true), [fetchEntity, sharedId]);
  const entity = withRecordedTranslations(state.entity, sharedId, recorded);

  return { entity, loading: !entity && !state.error && state.loading, error: state.error, reload };
};

export { useLibraryPreviewEntity };
