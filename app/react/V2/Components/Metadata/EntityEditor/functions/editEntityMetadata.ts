import type { ClientFile } from '#app/istore.js';
import { filterReferencedPendingAttachments } from '#shared/entitySave/mediaMetadata.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { EMPTY_ICON } from '../Components/IconField.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';
import { formatMetadataForForm, type FormMetadataProperty } from './formatMetadataForForm.js';
import {
  groupRelationshipProperties,
  syncGroupedRelationshipMetadata,
} from './relationshipGrouping.js';
import { toMetadataObjectSchema } from './toMetadataObjectSchema.js';

type BuildEditEntitySaveInputArgs = {
  entity: Entity;
  values: EditEntityFormValues;
  metadataProperties: FormMetadataProperty[];
  pendingAttachments: ClientFile[];
  mediaPropertyNames: Set<string>;
};

type SharedMetadataSync =
  | { type: 'noop' }
  | {
      type: 'reset';
      values: EditEntityFormValues;
      options: { keepDirty: true; keepDirtyValues: true };
    };

const formatMetadataForEntity = (
  metadata: EditEntityFormValues['metadata'],
  metadataProperties: FormMetadataProperty[]
): Entity['metadata'] => {
  const syncedMetadata = syncGroupedRelationshipMetadata(
    metadata,
    groupRelationshipProperties(metadataProperties)
  );

  return metadataProperties.reduce<NonNullable<Entity['metadata']>>((acc, property) => {
    const mapped = (syncedMetadata[property.name] ?? []).map(toMetadataObjectSchema);
    acc[property.name] =
      property.type === 'geolocation' ? mapped.filter(entry => entry.value !== null) : mapped;
    return acc;
  }, {});
};

const buildEditEntitySaveInput = ({
  entity,
  values,
  metadataProperties,
  pendingAttachments,
  mediaPropertyNames,
}: BuildEditEntitySaveInputArgs): EntitySaveInput => {
  const formattedMetadata = formatMetadataForEntity(values.metadata, metadataProperties);
  return {
    ...entity,
    title: values.title || entity.title,
    template: values.template || entity.template,
    icon: (values.showIcon ? values.icon : EMPTY_ICON) as Entity['icon'],
    metadata: formattedMetadata,
    attachments: [
      ...(entity.attachments ?? []),
      ...filterReferencedPendingAttachments(
        pendingAttachments,
        formattedMetadata,
        mediaPropertyNames
      ),
    ],
  };
};

const mergeSharedFormMetadata = (
  current: Record<string, MetadataValue[] | undefined>,
  metadataProperties: FormMetadataProperty[],
  entityMetadata?: Entity['metadata']
): Record<string, MetadataValue[]> | undefined => {
  const sameShape =
    metadataProperties.length === Object.keys(current).length &&
    metadataProperties.every(property => current[property.name] !== undefined);
  if (sameShape) return undefined;

  const defaults = formatMetadataForForm(metadataProperties, entityMetadata);
  return metadataProperties.reduce<Record<string, MetadataValue[]>>((acc, property) => {
    acc[property.name] = current[property.name] ?? defaults[property.name] ?? [];
    return acc;
  }, {});
};

const planSharedMetadataSync = (
  currentValues: EditEntityFormValues,
  metadataProperties: FormMetadataProperty[],
  entityMetadata?: Entity['metadata']
): SharedMetadataSync => {
  const metadata = mergeSharedFormMetadata(
    currentValues.metadata ?? {},
    metadataProperties,
    entityMetadata
  );
  if (!metadata) return { type: 'noop' };

  return {
    type: 'reset',
    values: { ...currentValues, metadata },
    options: { keepDirty: true, keepDirtyValues: true },
  };
};

export {
  formatMetadataForEntity,
  buildEditEntitySaveInput,
  mergeSharedFormMetadata,
  planSharedMetadataSync,
};
export type { SharedMetadataSync };
