import type { Entity } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import type { BaseMetadataProperty, MetadataProperty } from '../types.js';
import { formatDateProperty } from './formatDateProperty.js';
import { formatGeolocationProperty } from './formatGeolocationProperty.js';
import { formatImageProperty } from './formatImageProperty.js';
import { formatLinkProperty } from './formatLinkProperty.js';
import { formatMediaProperty } from './formatMediaProperty.js';
import { formatRelationshipProperty } from './formatRelationshipProperty.js';
import { formatSelectProperty } from './formatSelectProperty.js';
import { formatSimpleProperty } from './formatSimpleProperty.js';

type DenormCtx = {
  field: BaseMetadataProperty;
  metadata: Entity['metadata'];
  entity: Entity;
  templates: ClientTemplateSchema[];
  entityTemplate: ClientTemplateSchema | undefined;
};

type InnerDeps = {
  meta: Entity['metadata'];
  entity: Entity;
  templates: ClientTemplateSchema[];
  entityTemplate: ClientTemplateSchema | undefined;
};

const SIMPLE_INNER = new Set<BaseMetadataProperty['type']>([
  'text',
  'markdown',
  'generatedid',
  'numeric',
]);

const DATE_INNER = new Set<BaseMetadataProperty['type']>([
  'date',
  'daterange',
  'multidate',
  'multidaterange',
]);

const SELECT_INNER = new Set<BaseMetadataProperty['type']>(['select', 'multiselect']);

const IMAGE_INNER = new Set<BaseMetadataProperty['type']>(['image', 'preview']);

const INNER_TYPES = new Set<string>([
  'date',
  'daterange',
  'generatedid',
  'geolocation',
  'image',
  'link',
  'markdown',
  'media',
  'multidate',
  'multidaterange',
  'multiselect',
  'numeric',
  'preview',
  'relationship',
  'select',
  'text',
]);

const isInnerType = (type: string): type is BaseMetadataProperty['type'] => INNER_TYPES.has(type);

function findPropertyTypeByName(
  propertyName: string,
  templates: ClientTemplateSchema[]
): BaseMetadataProperty['type'] | undefined {
  for (const template of templates) {
    const match = template.properties?.find(p => p.name === propertyName);
    if (match?.type && isInnerType(match.type)) {
      return match.type;
    }
  }
  return undefined;
}

type DenormalizedMetadataValue = NonNullable<NonNullable<Entity['metadata']>[string]>[number];

function flattenInheritedValues(
  metadata: Entity['metadata'] | undefined,
  propertyName: string
): DenormalizedMetadataValue[] {
  const rows = metadata?.[propertyName] ?? [];
  return rows.flatMap(row => row.inheritedValue ?? []);
}

function innerField(
  base: BaseMetadataProperty,
  innerType: BaseMetadataProperty['type']
): BaseMetadataProperty {
  return {
    _id: base._id,
    name: base.name,
    label: base.label,
    type: innerType,
    hideLabel: base.hideLabel,
  };
}

function formatInnerFieldTextual(
  field: BaseMetadataProperty,
  meta: Entity['metadata']
): MetadataProperty | null {
  const t = field.type;
  if (SIMPLE_INNER.has(t)) {
    return formatSimpleProperty(field, meta);
  }
  if (DATE_INNER.has(t)) {
    return formatDateProperty(field, meta);
  }
  if (SELECT_INNER.has(t)) {
    return formatSelectProperty(field, meta);
  }
  return null;
}

function formatInnerLinkGeoMedia(
  field: BaseMetadataProperty,
  d: InnerDeps
): MetadataProperty | null {
  const t = field.type;
  if (t === 'link') {
    return formatLinkProperty(field, d.meta);
  }
  if (t === 'geolocation') {
    const entity = { ...d.entity, metadata: d.meta };
    return formatGeolocationProperty({ ...field, propertyGroup: undefined }, entity, d.templates);
  }
  if (t === 'media') {
    return formatMediaProperty(field, d.meta);
  }
  return null;
}

function formatInnerImageRelationship(
  field: BaseMetadataProperty,
  d: InnerDeps
): MetadataProperty | null {
  const t = field.type;
  if (IMAGE_INNER.has(t)) {
    return formatImageProperty(field, d.meta, d.entityTemplate);
  }
  if (t === 'relationship') {
    return formatRelationshipProperty(field, d.meta);
  }
  return null;
}

function formatByInnerType(field: BaseMetadataProperty, d: InnerDeps): MetadataProperty | null {
  return (
    formatInnerFieldTextual(field, d.meta) ??
    formatInnerLinkGeoMedia(field, d) ??
    formatInnerImageRelationship(field, d)
  );
}

function formatDenormalizedNewRelationship(ctx: DenormCtx): MetadataProperty | null {
  const { field, metadata, entity, templates, entityTemplate } = ctx;
  if (field.type !== 'newRelationship' || !field.denormalizedProperty) {
    return null;
  }
  const innerType = findPropertyTypeByName(field.denormalizedProperty, templates);
  if (!innerType) {
    return null;
  }
  const flat = flattenInheritedValues(metadata, field.name);
  if (flat.length === 0) {
    return null;
  }
  const denormalizedMetadata: Entity['metadata'] = { [field.name]: flat };
  return formatByInnerType(innerField(field, innerType), {
    meta: denormalizedMetadata,
    entity,
    templates,
    entityTemplate,
  });
}

export { formatDenormalizedNewRelationship };
