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

const commitLanguageState = ({
  sharedId,
  nextLanguage,
  nextEntity,
  defaultLanguage,
  setEntity,
  setMainDocument,
  setLanguageState,
}: {
  sharedId: string;
  nextLanguage: string;
  nextEntity: Entity;
  defaultLanguage?: string;
} & Omit<LanguageSetters, 'setPagePlaintext'>) => {
  const nextMainDocument = resolveMainDocument(
    sharedId,
    nextLanguage,
    nextEntity.documents,
    defaultLanguage
  );
  setMainDocument(nextMainDocument);
  setLanguageState(nextLanguage);
  setEntity(nextEntity);
  return nextMainDocument;
};

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

const applyEntityLanguage = async (
  nextLanguage: string,
  isCurrent: () => boolean,
  deps: ApplyDeps
): Promise<ApplyLanguageResult> => {
  const fetched = await fetchCurrentEntity(deps.sharedId, nextLanguage, isCurrent);
  if (fetched.status !== 'applied' || !fetched.entity || !deps.sharedId) {
    return fetched.status;
  }

  const nextMainDocument = commitLanguageState({
    sharedId: deps.sharedId,
    nextLanguage,
    nextEntity: fetched.entity,
    defaultLanguage: deps.defaultLanguage,
    setEntity: deps.setEntity,
    setMainDocument: deps.setMainDocument,
    setLanguageState: deps.setLanguageState,
  });
  const nextPlaintext = await resolvePlaintext(nextMainDocument);
  if (!isCurrent()) {
    return 'stale';
  }
  deps.setPagePlaintext(nextPlaintext);
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
