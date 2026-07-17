import { useCallback, useRef } from 'react';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import {
  fetchEntityForLanguage,
  resolveMainDocument,
  resolvePlaintext,
} from './entityLanguageUtils.js';

type ApplyLanguageResult = 'applied' | 'stale' | 'failed';

type LanguageSetters = {
  setEntity: (entity: Entity) => void;
  setMainDocument: (document: FileType | undefined) => void;
  setLanguageState: (language: string) => void;
  setPagePlaintext: (text: string | undefined) => void;
};

type ApplyDeps = LanguageSetters & { sharedId: string | undefined; defaultLanguage?: string };

const fetchCurrentEntity = async (
  sharedId: string | undefined,
  nextLanguage: string,
  isCurrent: () => boolean
): Promise<{ status: ApplyLanguageResult; entity?: Entity }> => {
  if (!sharedId) {
    return { status: 'failed' };
  }
  const entity = await fetchEntityForLanguage(sharedId, nextLanguage);
  if (!isCurrent()) {
    return { status: 'stale' };
  }
  if (!entity) {
    return { status: 'failed' };
  }
  return { status: 'applied', entity };
};

const commitAppliedLanguage = ({
  nextLanguage,
  nextEntity,
  nextMainDocument,
  nextPlaintext,
  setMainDocument,
  setLanguageState,
  setEntity,
  setPagePlaintext,
}: LanguageSetters & {
  nextLanguage: string;
  nextEntity: Entity;
  nextMainDocument: FileType | undefined;
  nextPlaintext: string | undefined;
}) => {
  setMainDocument(nextMainDocument);
  setLanguageState(nextLanguage);
  setEntity(nextEntity);
  setPagePlaintext(nextPlaintext);
};

const applyEntityLanguage = async (
  nextLanguage: string,
  isCurrent: () => boolean,
  deps: ApplyDeps
): Promise<ApplyLanguageResult> => {
  const fetched = await fetchCurrentEntity(deps.sharedId, nextLanguage, isCurrent);
  if (fetched.status !== 'applied' || !fetched.entity || !deps.sharedId) {
    return fetched.status;
  }

  const nextMainDocument = resolveMainDocument(
    deps.sharedId,
    nextLanguage,
    fetched.entity.documents,
    deps.defaultLanguage
  );
  const nextPlaintext = await resolvePlaintext(nextMainDocument);
  if (!isCurrent()) {
    return 'stale';
  }

  commitAppliedLanguage({
    nextLanguage,
    nextEntity: fetched.entity,
    nextMainDocument,
    nextPlaintext,
    setMainDocument: deps.setMainDocument,
    setLanguageState: deps.setLanguageState,
    setEntity: deps.setEntity,
    setPagePlaintext: deps.setPagePlaintext,
  });
  return 'applied';
};

const useApplyEntityLanguage = ({
  loaderEntity,
  defaultLanguage,
  setEntity,
  setMainDocument,
  setLanguageState,
  setPagePlaintext,
}: LanguageSetters & { loaderEntity: Entity; defaultLanguage?: string }) => {
  const applyGenerationRef = useRef(0);

  return useCallback(
    async (nextLanguage: string): Promise<ApplyLanguageResult> => {
      applyGenerationRef.current += 1;
      const generation = applyGenerationRef.current;
      return applyEntityLanguage(nextLanguage, () => generation === applyGenerationRef.current, {
        sharedId: loaderEntity.sharedId,
        defaultLanguage,
        setEntity,
        setMainDocument,
        setLanguageState,
        setPagePlaintext,
      });
    },
    [loaderEntity, defaultLanguage, setEntity, setMainDocument, setLanguageState, setPagePlaintext]
  );
};

export { useApplyEntityLanguage };
export type { ApplyLanguageResult };
