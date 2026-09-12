import { useCallback, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { Entity } from '#V2/api/entities/types.js';
import type { EditEntityFormValues } from '#V2/Components/Metadata/EntityEditor/index.js';
import type { EntitiesService } from '#V2/services/index.js';
import { applyCopyFromMetadata } from './applyCopyFromMetadata.js';
import { copyFromMatchingProperties, type CopyFromTemplate } from './copyFromMatchingProperties.js';

const loadCopyFromSource = async (
  entities: EntitiesService,
  sharedId: string,
  language: string
): Promise<Entity | undefined> => {
  const [rows] = await entities.getBySharedId(sharedId, {
    language,
    omitRelationships: true,
  });
  return rows?.find(row => row.language === language) ?? rows?.[0];
};

const useCopyFromSource = ({
  language,
  entities,
  form,
  templates,
  currentTemplateId,
  setIsDirty,
  onClose,
}: {
  language: string;
  entities: EntitiesService;
  form: UseFormReturn<EditEntityFormValues>;
  templates: CopyFromTemplate[];
  currentTemplateId?: string;
  setIsDirty: (dirty: boolean) => void;
  onClose: () => void;
}) => {
  const [source, setSource] = useState<Entity>();
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const matchingProperties = useMemo(
    () => copyFromMatchingProperties(templates, currentTemplateId, source?.template),
    [currentTemplateId, source?.template, templates]
  );

  const selectCandidate = useCallback(
    async (candidate: Entity) => {
      setIsLoadingSource(true);
      try {
        const loaded = await loadCopyFromSource(entities, candidate.sharedId, language);
        if (loaded) setSource(loaded);
      } finally {
        setIsLoadingSource(false);
      }
    },
    [entities, language]
  );

  const stageFields = useCallback(() => {
    if (!source || matchingProperties.length === 0) return;
    const nextMetadata = applyCopyFromMetadata({
      currentMetadata: form.getValues('metadata') ?? {},
      sourceMetadata: source.metadata,
      matchingProperties,
    });
    matchingProperties.forEach(property => {
      form.setValue(`metadata.${property.name}`, nextMetadata[property.name], {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
    setIsDirty(true);
    onClose();
  }, [form, matchingProperties, onClose, setIsDirty, source]);

  return {
    source,
    isLoadingSource,
    matchingProperties,
    selectCandidate,
    stageFields,
    pickAnother: () => setSource(undefined),
  };
};

export { useCopyFromSource };
