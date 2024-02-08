import { propertyTypes } from 'shared/propertyTypes';
import { provenanceTypes } from 'shared/provenanceTypes';

export const emitSchemaTypes = true;

export const objectIdSchema = {
  oneOf: [
    { type: 'string' },
    {
      type: 'object',
      tsType: 'ObjectId',
    },
  ],
};

export const attachmentSchema = {
  type: 'object',
  properties: {
    _id: objectIdSchema,
    originalname: { type: 'string' },
    filename: { type: 'string' },
    mimetype: { type: 'string' },
    url: { type: 'string' },
    timestamp: { type: 'number' },
    size: { type: 'number' },
  },
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

export const LanguageISO6391Schema = {
  title: 'LanguageISO6391',
  type: 'string',
  enum: [
    'ab',
    'aa',
    'af',
    'ak',
    'sq',
    'am',
    'ar',
    'an',
    'hy',
    'as',
    'av',
    'ae',
    'ay',
    'az',
    'bm',
    'ba',
    'eu',
    'be',
    'bn',
    'bh',
    'bi',
    'bs',
    'br',
    'bg',
    'my',
    'ca',
    'ch',
    'ce',
    'ny',
    'zh',
    'zh-Hans',
    'zh-Hant',
    'cv',
    'kw',
    'co',
    'cr',
    'hr',
    'cs',
    'da',
    'dv',
    'nl',
    'dz',
    'en',
    'eo',
    'et',
    'ee',
    'fo',
    'fj',
    'fi',
    'fr',
    'ff',
    'gl',
    'gd',
    'gv',
    'ka',
    'de',
    'el',
    'gn',
    'gu',
    'ht',
    'ha',
    'he',
    'hz',
    'hi',
    'ho',
    'hu',
    'is',
    'io',
    'ig',
    'in',
    'ia',
    'ie',
    'iu',
    'ik',
    'ga',
    'it',
    'ja',
    'jv',
    'kl',
    'kn',
    'kr',
    'ks',
    'kk',
    'km',
    'ki',
    'rw',
    'rn',
    'ky',
    'kv',
    'kg',
    'ko',
    'ku',
    'kj',
    'lo',
    'la',
    'lv',
    'li',
    'ln',
    'lt',
    'lu',
    'lg',
    'lb',
    'mk',
    'mg',
    'ms',
    'ml',
    'mt',
    'mi',
    'mr',
    'mh',
    'mn',
    'na',
    'nv',
    'ng',
    'nd',
    'ne',
    'no',
    'nb',
    'nn',
    'oc',
    'oj',
    'cu',
    'or',
    'om',
    'os',
    'pi',
    'ps',
    'fa',
    'pl',
    'pt',
    'pa',
    'qu',
    'rm',
    'ro',
    'ru',
    'se',
    'sm',
    'sg',
    'sa',
    'sr',
    'sh',
    'st',
    'tn',
    'sn',
    'ii',
    'sd',
    'si',
    'ss',
    'sk',
    'sl',
    'so',
    'nr',
    'es',
    'su',
    'sw',
    'sv',
    'tl',
    'ty',
    'tg',
    'ta',
    'tt',
    'te',
    'th',
    'bo',
    'ti',
    'to',
    'ts',
    'tr',
    'tk',
    'tw',
    'ug',
    'uk',
    'ur',
    'uz',
    've',
    'vi',
    'vo',
    'wa',
    'cy',
    'wo',
    'fy',
    'xh',
    'yi',
    'yo',
    'za',
    'zu',
  ],
};

export const languageSchema = {
  type: 'object',
  required: ['key', 'label'],
  additionalProperties: false,
  definitions: {
    LanguageISO6391Schema,
  },
  properties: {
    _id: objectIdSchema,
    label: { type: 'string' },
    key: LanguageISO6391Schema,
    rtl: { type: 'boolean' },
    default: { type: 'boolean' },
    ISO639_3: { type: 'string' },
    localized_label: { type: 'string' },
    translationAvailable: { type: 'boolean' },
  },
};

export const languagesListSchema = {
  type: 'array',
  definitions: {
    LanguageISO6391Schema,
  },
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
    { type: 'boolean' },
    linkSchema,
    dateRangeSchema,
    latLonSchema,
    geolocationSchema,
  ],
};

export const selectParentSchema = {
  type: 'object',
  required: ['label', 'value'],
  additionalProperties: false,
  properties: {
    label: { type: 'string' },
    value: { type: 'string' },
  },
};

export const inheritedValueSchema = {
  type: 'object',
  required: ['value'],
  definitions: { propertyValueSchema, selectParentSchema },
  properties: {
    value: propertyValueSchema,
    label: { type: 'string' },
    parent: selectParentSchema,
  },
};

export const metadataObjectSchema = {
  type: 'object',
  definitions: { propertyValueSchema, inheritedValueSchema, selectParentSchema },
  required: ['value'],
  properties: {
    value: propertyValueSchema,
    attachment: { type: 'number' },
    label: { type: 'string' },
    suggestion_confidence: { type: 'number' },
    suggestion_model: { type: 'string' },
    provenance: { type: 'string', enum: Object.values(provenanceTypes) },
    inheritedValue: { type: 'array', items: inheritedValueSchema },
    inheritedType: { type: 'string' },
    timeLinks: { type: 'string' },
    parent: selectParentSchema,
  },
};

export const metadataSchema = {
  type: 'object',
  definitions: { metadataObjectSchema },
  additionalProperties: {
    anyOf: [{ type: 'array', items: metadataObjectSchema }],
  },
  patternProperties: {
    '^.*_nested$': { type: 'array', items: { type: 'object' } },
  },
};

export const selectionRectangleSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    top: { type: 'number' },
    left: { type: 'number' },
    width: { type: 'number' },
    height: { type: 'number' },
    page: { type: 'string' },
  },
};

export const selectionRectanglesSchema = {
  type: 'array',
  items: selectionRectangleSchema,
};

export const tocSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    selectionRectangles: selectionRectanglesSchema,
    label: { type: 'string' },
    indentation: { type: 'number' },
  },
};

export const extractedMetadataSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    propertyID: { type: 'string' },
    name: { type: 'string' },
    timestamp: { type: 'string' },
    deleteSelection: { type: 'boolean' },
    selection: {
      type: 'object',
      additionalProperties: false,
      properties: {
        text: { type: 'string' },
        selectionRectangles: selectionRectanglesSchema,
      },
    },
  },
};

export const propertySchema = {
  type: 'object',
  required: ['label', 'type', 'name'],
  additionalProperties: false,
  requireOrInvalidContentForSelectFields: true,
  requireRelationTypeForRelationship: true,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    label: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    isCommonProperty: { type: 'boolean' },
    type: { type: 'string', enum: Object.values(propertyTypes) },
    prioritySorting: { type: 'boolean' },
    generatedId: { type: 'boolean' },
    content: { type: 'string' },
    relationType: { type: 'string' },
    inherit: {
      type: 'object',
      additionalProperties: false,
      properties: {
        property: { type: 'string' },
        type: { type: 'string', enum: Object.values(propertyTypes) },
      },
    },
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
    // for relationships v2
    query: {
      type: 'array',
    },
    denormalizedProperty: { type: 'string' },
    targetTemplates: {
      oneOf: [
        { type: 'boolean', enum: [false] },
        { type: 'array', items: { type: 'string' } },
      ],
    },
  },
};
