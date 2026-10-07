import type { ClientFile } from '#app/istore.js';
import {
  currentAndTranslationMetadata,
  filterReferencedPendingAttachments,
} from '#shared/entitySave/mediaMetadata.js';
import type { LanguagesListSchema, PropertySelectionSchema } from '#shared/types/commonTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { EMPTY_ICON, hasEntityIcon, type EntityIcon } from '../Components/IconField.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';
import { buildTranslationsForSave } from './entityTranslations.js';
import {
  formatMetadataForForm,
  metadataFormKey,
  type FormMetadataProperty,
} from './formatMetadataForForm.js';
import {
  groupRelationshipProperties,
  syncGroupedRelationshipMetadata,
} from './relationshipGrouping.js';
import { toMetadataObjectSchema } from './toMetadataObjectSchema.js';

type BuildEditEntitySaveInputArgs = {
  entity?: Entity;
  values: EditEntityFormValues;
  metadataProperties: FormMetadataProperty[];
  pendingAttachments: ClientFile[];
  mediaPropertyNames: Set<string>;
  currentLanguage: string;
  languages?: LanguagesListSchema;
  mainDocumentId?: string;
  draftPropertySelections?: PropertySelectionSchema[];
};

type SharedMetadataSync =
  | { type: 'noop' }
  | {
      type: 'reset';
      values: EditEntityFormValues;
      options: { keepDirty: true };
    };

const toSaveIcon = (showIcon: boolean, icon: EntityIcon): EntityIcon => {
  if (showIcon && hasEntityIcon(icon) && icon._id !== null) {
    return { _id: icon._id, type: icon.type, label: icon.label };
  }
  return EMPTY_ICON;
};

const mediaPropertyNamesForSave = (metadataProperties: FormMetadataProperty[]) =>
  new Set(
    metadataProperties
      .filter(property => property.type === 'image' || property.type === 'media')
      .map(property => property.name)
  );

const formatMetadataForEntity = (
  metadata: EditEntityFormValues['metadata'],
  metadataProperties: FormMetadataProperty[]
): Entity['metadata'] => {
  const syncedMetadata = syncGroupedRelationshipMetadata(
    metadata,
    groupRelationshipProperties(metadataProperties)
  );

  return metadataProperties.reduce<NonNullable<Entity['metadata']>>((acc, property) => {
    const mapped = (syncedMetadata[metadataFormKey(property.name)] ?? []).map(
      toMetadataObjectSchema
    );
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
  currentLanguage,
  languages = [],
  mainDocumentId,
  draftPropertySelections,
}: BuildEditEntitySaveInputArgs): EntitySaveInput => {
  const formattedMetadata = formatMetadataForEntity(values.metadata, metadataProperties);
  const translations = buildTranslationsForSave({
    values,
    metadataProperties,
    languages,
    currentLanguage,
  });
  const saved: EntitySaveInput = {
    ...(entity ?? {}),
    title: values.title || entity?.title || '',
    template: values.template || entity?.template || '',
    language: currentLanguage,
    icon: toSaveIcon(values.showIcon, values.icon),
    metadata: formattedMetadata,
    attachments: [
      ...(entity?.attachments ?? []),
      ...filterReferencedPendingAttachments(
        pendingAttachments,
        currentAndTranslationMetadata(formattedMetadata, translations),
        mediaPropertyNames
      ),
    ],
    ...(translations ? { translations } : {}),
  };

  if (mainDocumentId && draftPropertySelections && draftPropertySelections.length > 0) {
    saved.propertySelections = {
      fileID: mainDocumentId,
      selections: draftPropertySelections,
    };
  }

  return saved;
};

const isEntityEditorDirty = (formIsDirty: boolean, draftPropertySelectionsCount: number) =>
  formIsDirty || draftPropertySelectionsCount > 0;

const mergeSharedFormMetadata = (
  current: Record<string, MetadataValue[] | undefined>,
  metadataProperties: FormMetadataProperty[],
  entityMetadata?: Entity['metadata']
): Record<string, MetadataValue[]> => {
  const defaults = formatMetadataForForm(metadataProperties, entityMetadata);
  return metadataProperties.reduce<Record<string, MetadataValue[]>>((acc, property) => {
    const key = metadataFormKey(property.name);
    acc[key] = current[key] ?? defaults[key] ?? [];
    return acc;
  }, {});
};

const isSameMetadataShape = (
  current: Record<string, MetadataValue[] | undefined>,
  metadataProperties: FormMetadataProperty[]
): boolean => {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== metadataProperties.length) return false;

  const formKeys = metadataProperties.map(property => metadataFormKey(property.name));
  const propertyNames = new Set(formKeys);
  return (
    currentKeys.every(key => propertyNames.has(key)) &&
    formKeys.every(key => current[key] !== undefined)
  );
};

type PlanSharedMetadataSyncOptions = {
  force?: boolean;
};

const planSharedMetadataSync = ({
  currentValues,
  metadataProperties,
  entityMetadata,
  options,
}: {
  currentValues: EditEntityFormValues;
  metadataProperties: FormMetadataProperty[];
  entityMetadata?: Entity['metadata'];
  options?: PlanSharedMetadataSyncOptions;
}): SharedMetadataSync => {
  const currentMetadata = currentValues.metadata ?? {};
  if (!options?.force && isSameMetadataShape(currentMetadata, metadataProperties)) {
    return { type: 'noop' };
  }

  return {
    type: 'reset',
    values: {
      ...currentValues,
      metadata: mergeSharedFormMetadata(currentMetadata, metadataProperties, entityMetadata),
    },
    options: { keepDirty: true },
  };
};

export {
  formatMetadataForEntity,
  buildEditEntitySaveInput,
  mediaPropertyNamesForSave,
  mergeSharedFormMetadata,
  planSharedMetadataSync,
  isEntityEditorDirty,
};
export type { SharedMetadataSync };
