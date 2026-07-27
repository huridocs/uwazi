import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { formatMetadataForForm, type FormMetadataProperty } from './formatMetadataForForm.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';

type SharedMetadataSync =
  | { type: 'noop' }
  | {
      type: 'reset';
      values: EditEntityFormValues;
      options: { keepDirty: true; keepDirtyValues: true };
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

export { mergeSharedFormMetadata, planSharedMetadataSync };
export type { SharedMetadataSync };
