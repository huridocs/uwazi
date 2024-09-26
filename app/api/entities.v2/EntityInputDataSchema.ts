import { availableLanguagesISO6391 } from 'shared/languagesList';

const linkSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['label', 'url'],
  properties: {
    label: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    url: { oneOf: [{ type: 'string' }, { type: 'null' }] },
  },
};

const dateRangeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'to'],
  properties: {
    from: { oneOf: [{ type: 'number' }, { type: 'null' }] },
    to: { oneOf: [{ type: 'number' }, { type: 'null' }] },
  },
};

const latLonSchema = {
  type: 'object',
  required: ['lon', 'lat'],
  additionalProperties: false,
  properties: {
    label: { type: 'string' },
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
  },
};

const geolocationSchema = {
  type: 'array',
  items: latLonSchema,
};

const propertyValueSchema = {
  definitions: { linkSchema, dateRangeSchema, latLonSchema },
  oneOf: [
    { type: 'null' },
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    linkSchema,
    dateRangeSchema,
    latLonSchema,
    geolocationSchema,
  ],
};

const metadataObjectSchema = {
  type: 'object',
  definitions: { propertyValueSchema },
  required: ['value'],
  properties: {
    value: propertyValueSchema,
  },
};

const metadataSchema = {
  type: 'object',
  definitions: { metadataObjectSchema },
  additionalProperties: {
    anyOf: [{ type: 'array', items: metadataObjectSchema }],
  },
  patternProperties: {
    '^.*_nested$': { type: 'array', items: { type: 'object' } },
  },
};

export const entityInputDataSchema = {
  title: 'EntityInputData',
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  required: ['_id', 'sharedId', 'language', 'title', 'template', 'metadata'],
  properties: {
    _id: { type: 'string' },
    sharedId: { type: 'string', minLength: 1 },
    language: { enum: availableLanguagesISO6391 },
    title: { type: 'string', minLength: 1 },
    template: { type: 'string' },
    metadata: metadataSchema,
  },
};

export const emitSchemaTypes = true;
