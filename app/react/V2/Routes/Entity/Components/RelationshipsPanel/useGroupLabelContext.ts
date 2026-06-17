import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';

const useGroupLabelContext = (entity: Entity | undefined) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);

  return useMemo(
    () => ({
      selfSharedId: entity?.sharedId ?? '',
      selfTitle: entity?.title ?? '',
      selfTemplateId: entity?.template ?? '',
      relationshipTypeName: (typeId: string) =>
        relationshipTypes.find(type => type._id === typeId)?.name ?? typeId,
      templateName: (templateId: string) =>
        templates.find(template => template._id === templateId)?.name ?? templateId,
      templateColor: (templateId: string) =>
        templates.find(template => template._id === templateId)?.color,
    }),
    [entity?.sharedId, entity?.title, entity?.template, relationshipTypes, templates]
  );
};

export { useGroupLabelContext };
