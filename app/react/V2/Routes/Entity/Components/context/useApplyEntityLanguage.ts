import { useCallback, useRef } from 'react';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import {
  fetchEntityForLanguage,
  resolveMainDocument,
  resolvePlaintext,
} from './entityLanguageUtils.js';

type LanguageSetters = {
  setEntity: (entity: Entity) => void;
  setMainDocument: (document: FileType | undefined) => void;
  setLanguageState: (language: string) => void;
  setPagePlaintext: (text: string | undefined) => void;
};

const commitLanguageState = (
  sharedId: string,
  nextLanguage: string,
  nextEntity: Entity,
  defaultLanguage: string | undefined,
  { setEntity, setMainDocument, setLanguageState }: Omit<LanguageSetters, 'setPagePlaintext'>
  // eslint-disable-next-line max-params
) => {
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

const applyEntityLanguage = async (
  nextLanguage: string,
  isCurrent: () => boolean,
  {
    sharedId,
    defaultLanguage,
    setEntity,
    setMainDocument,
    setLanguageState,
    setPagePlaintext,
  }: LanguageSetters & { sharedId: string | undefined; defaultLanguage?: string }
) => {
  if (!sharedId) {
    return;
  }

  const nextEntity = await fetchEntityForLanguage(sharedId, nextLanguage);
  if (!isCurrent() || !nextEntity) {
    return;
  }

  const nextMainDocument = commitLanguageState(
    sharedId,
    nextLanguage,
    nextEntity,
    defaultLanguage,
    {
      setEntity,
      setMainDocument,
      setLanguageState,
    }
  );
  const nextPlaintext = await resolvePlaintext(nextMainDocument);
  if (isCurrent()) {
    setPagePlaintext(nextPlaintext);
  }
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
    async (nextLanguage: string) => {
      applyGenerationRef.current += 1;
      const generation = applyGenerationRef.current;
      await applyEntityLanguage(nextLanguage, () => generation === applyGenerationRef.current, {
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
