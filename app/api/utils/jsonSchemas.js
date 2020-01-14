/** @format */

import { propertyTypes } from 'shared/propertyTypes';

const fieldTypes = Object.values(propertyTypes);

export const objectIdSchema = {
  oneOf: [{ type: 'string' }, { type: 'object' }],
};

export const linkSchema = {
  type: 'object',
  required: ['label', 'url'],
  properties: {
    label: { type: 'string', minLength: 1 },
    url: { type: 'string', minLength: 1 },
  },
};

export const dateRangeSchema = {
  type: 'object',
  properties: {
    from: {
      oneOf: [{ type: 'number' }, { type: 'null' }],
    },
    to: {
      oneOf: [{ type: 'number' }, { type: 'null' }],
    },
  },
  additionalProperties: false,
};

export const latLonSchema = {
  type: 'object',
  required: ['lon', 'lat'],
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

export const nestedSchema = {
  type: 'array',
  items: {
    oneOf: [
      {
        type: 'object',
        patternProperties: {
          '^(?!lat).*$': { type: 'array', items: { type: 'string' } },
        },
      },
    ],
  },
};

export const tocSchema = {
  type: 'object',
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
    type: { type: 'string', enum: fieldTypes },
    prioritySorting: { type: 'boolean' },
    content: { type: 'string', minLength: 1 },
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
