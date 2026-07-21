import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/index.js';

const useGroupLabelContext = () => {
  const entity = useEntityScopedEntity();
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
