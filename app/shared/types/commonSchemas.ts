import { propertyTypes } from 'shared/propertyTypes';
import { provenanceTypes } from 'shared/provenanceTypes';

export const emitSchemaTypes = true;

export const objectIdSchema = {
  oneOf: [{ type: 'string' }, { type: 'object' }],
};

export const linkSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    label: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    url: { oneOf: [{ type: 'string' }, { type: 'null' }] },
  },
};

export const dateRangeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    from: { oneOf: [{ type: 'number' }, { type: 'null' }] },
    to: { oneOf: [{ type: 'number' }, { type: 'null' }] },
  },
};

export const languageSchema = {
  type: 'object',
  required: ['key', 'label'],
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    label: { type: 'string' },
    key: { type: 'string' },
    rtl: { type: 'boolean' },
    default: { type: 'boolean' },
  },
};

export const languagesListSchema = {
  type: 'array',
  items: languageSchema,
};

export const latLonSchema = {
  type: 'object',
  required: ['lon', 'lat'],
  additionalProperties: false,
  properties: {
    label: { type: 'string' },
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
  },
};

export const geolocationSchema = {
  type: 'array',
  items: latLonSchema,
};

export const propertyValueSchema = {
  definitions: { linkSchema, dateRangeSchema, latLonSchema },
  oneOf: [
    { type: 'null' },
    { type: 'string' },
    { type: 'number' },
    linkSchema,
    dateRangeSchema,
    latLonSchema,
    geolocationSchema,
  ],
};

export const metadataObjectSchema = {
  type: 'object',
  definitions: { propertyValueSchema },
  required: ['value'],
  properties: {
    value: propertyValueSchema,
    label: { type: 'string' },
    suggestion_confidence: { type: 'number' },
    suggestion_model: { type: 'string' },
    provenance: { type: 'string', enum: Object.values(provenanceTypes) },
  },
};

export const metadataSchema = {
  definitions: { metadataObjectSchema },
  type: 'object',
  additionalProperties: {
    anyOf: [{ type: 'array', items: metadataObjectSchema }],
  },
  patternProperties: {
    '^.*_nested$': { type: 'array', items: { type: 'object' } },
  },
};

export const tocSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    range: {
      type: 'object',
      properties: {
        start: { type: 'number' },
        end: { type: 'number' },
      },
    },
    label: { type: 'string' },
    indentation: { type: 'number' },
  },
};

export const propertySchema = {
  type: 'object',
  required: ['label', 'type'],
  requireContentForSelectFields: true,
  requireRelationTypeForRelationship: true,
  requireInheritPropertyForInheritingRelationship: true,
  properties: {
    id: { type: 'string' },
    label: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    isCommonProperty: { type: 'boolean' },
    type: { type: 'string', enum: Object.values(propertyTypes) },
    prioritySorting: { type: 'boolean' },
    content: { type: 'string' },
    inherit: { type: 'boolean' },
    inheritProperty: { type: 'string', minLength: 1 },
    filter: { type: 'boolean' },
    noLabel: { type: 'boolean' },
    fullWidth: { type: 'boolean' },
    defaultfilter: { type: 'boolean' },
    required: { type: 'boolean' },
    sortable: { type: 'boolean' },
    showInCard: { type: 'boolean' },
    style: { type: 'string' },
    nestedProperties: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};
