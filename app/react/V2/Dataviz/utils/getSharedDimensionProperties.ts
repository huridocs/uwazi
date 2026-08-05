import type { ClientPropertySchema, ClientTemplateSchema } from '#app/istore.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';
import { filterDatavizProperties } from './filterDatavizProperties.js';

const RELATIONSHIP_TYPES = new Set(['relationship', 'newRelationship']);
const THESAURUS_TYPES = new Set(['select', 'multiselect']);

const normalizeId = (value?: string) => value ?? '';

export const propertiesMatchForDataviz = (
  left: ClientPropertySchema,
  right: ClientPropertySchema
): boolean => {
  if (left.name !== right.name) {
    return false;
  }

  if (left.type !== right.type) {
    return false;
  }

  if (THESAURUS_TYPES.has(left.type)) {
    return normalizeId(left.content) === normalizeId(right.content);
  }

  if (RELATIONSHIP_TYPES.has(left.type)) {
    if (normalizeId(left.content) !== normalizeId(right.content)) {
      return false;
    }

    if (normalizeId(left.relationType) !== normalizeId(right.relationType)) {
      return false;
    }

    return (
      normalizeId(left.inherit?.property) === normalizeId(right.inherit?.property) &&
      normalizeId(left.inherit?.type) === normalizeId(right.inherit?.type)
    );
  }

  return true;
};

export const getSharedDimensionProperties = (
  sources: DatavizSource[],
  templates: ClientTemplateSchema[]
): ClientPropertySchema[] => {
  if (sources.length === 0) {
    return [];
  }

  const propertiesBySource = sources.map(source => {
    const template = templates.find(item => item._id === source.templateId);
    return filterDatavizProperties(template?.properties || []);
  });

  const [firstTemplateProperties = [], ...otherTemplateProperties] = propertiesBySource;

  if (sources.length === 1) {
    return firstTemplateProperties;
  }

  return firstTemplateProperties.filter(property =>
    otherTemplateProperties.every(properties =>
      properties.some(candidate => propertiesMatchForDataviz(property, candidate))
    )
  );
};

export const isDimensionPropertyStillValid = (
  dimensionProperty: string | undefined,
  sources: DatavizSource[],
  templates: ClientTemplateSchema[]
): boolean => {
  if (!dimensionProperty) {
    return true;
  }

  return getSharedDimensionProperties(sources, templates).some(
    property => property.name === dimensionProperty
  );
};
