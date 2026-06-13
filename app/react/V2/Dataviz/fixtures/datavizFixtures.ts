import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { ClientTemplateSchema, RelationshipTypesType } from '#app/istore.js';
import {
  TEMPLATE_DIMENSION_PROPERTY,
  type DatavizDataDTO,
  type DatavizDefinition,
} from '#V2/Dataviz/types/index.js';

export const DATAVIZ_CARS_TEMPLATE_ID = 'tpl_cars';
export const DATAVIZ_PERSONAS_TEMPLATE_ID = 'tpl_personas';
export const DATAVIZ_COLORS_THESAURUS_ID = 'th_colors';
export const DATAVIZ_SEX_THESAURUS_ID = 'th_sex';
export const DATAVIZ_COUNTRIES_THESAURUS_ID = 'th_countries';
export const DATAVIZ_CARS_BY_COLOR_ID = 'dv_cars_colors';
export const DATAVIZ_PERSONAS_SEX_COUNTRY_ID = 'dv_personas_sex_country';

export const datavizThesauri: ClientThesaurus[] = [
  {
    _id: DATAVIZ_COLORS_THESAURUS_ID,
    name: 'Colors',
    values: [
      { label: 'Red', id: 'color_red' },
      { label: 'Blue', id: 'color_blue' },
      { label: 'Green', id: 'color_green' },
      { label: 'Black', id: 'color_black' },
      { label: 'White', id: 'color_white' },
      { label: 'Silver', id: 'color_silver' },
      { label: 'Other', id: 'color_other' },
    ],
  },
  {
    _id: DATAVIZ_SEX_THESAURUS_ID,
    name: 'Sex',
    values: [
      { label: 'Female', id: 'sex_female' },
      { label: 'Male', id: 'sex_male' },
      { label: 'Other', id: 'sex_other' },
    ],
  },
  {
    _id: DATAVIZ_COUNTRIES_THESAURUS_ID,
    name: 'Countries',
    values: [
      { label: 'Argentina', id: 'country_ar' },
      { label: 'Chile', id: 'country_cl' },
      { label: 'Colombia', id: 'country_co' },
      { label: 'Mexico', id: 'country_mx' },
      { label: 'Other', id: 'country_other' },
    ],
  },
];

export const datavizTemplates: ClientTemplateSchema[] = [
  {
    _id: DATAVIZ_CARS_TEMPLATE_ID,
    name: 'Cars',
    color: '#4A90D9',
    commonProperties: [
      { _id: 'cp_title', name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
      {
        _id: 'cp_created',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        isCommonProperty: true,
      },
      {
        _id: 'cp_edited',
        name: 'editDate',
        label: 'Date modified',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: 'prop_colors',
        name: 'colors',
        label: 'Colors',
        type: 'select',
        content: DATAVIZ_COLORS_THESAURUS_ID,
      },
      {
        _id: 'prop_year',
        name: 'year',
        label: 'Year',
        type: 'date',
      },
      {
        _id: 'prop_mileage',
        name: 'mileage',
        label: 'Mileage',
        type: 'numeric',
      },
      {
        _id: 'prop_description',
        name: 'description',
        label: 'Description',
        type: 'markdown',
      },
      {
        _id: 'prop_owner',
        name: 'current_owner',
        label: 'Current owner',
        type: 'relationship',
        relationType: 'rel_owner',
        content: 'tpl_owners',
      },
    ],
  },
  {
    _id: 'tpl_owners',
    name: 'Owners',
    color: '#7B68EE',
    commonProperties: [
      { _id: 'cp_title_o', name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
      {
        _id: 'cp_created_o',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        isCommonProperty: true,
      },
      {
        _id: 'cp_edited_o',
        name: 'editDate',
        label: 'Date modified',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: 'prop_country',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'th_countries',
      },
    ],
  },
  {
    _id: DATAVIZ_PERSONAS_TEMPLATE_ID,
    name: 'Personas',
    color: '#2C7A7B',
    commonProperties: [
      { _id: 'cp_title_p', name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
      {
        _id: 'cp_created_p',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: 'prop_sex',
        name: 'sex',
        label: 'Sex',
        type: 'select',
        content: DATAVIZ_SEX_THESAURUS_ID,
      },
      {
        _id: 'prop_birth_country',
        name: 'birth_country',
        label: 'Country of birth',
        type: 'select',
        content: DATAVIZ_COUNTRIES_THESAURUS_ID,
      },
    ],
  },
  {
    _id: 'tpl_manufacturers',
    name: 'Manufacturers',
    color: '#E67E22',
    commonProperties: [
      { _id: 'cp_title_m', name: 'title', label: 'Title', type: 'text', isCommonProperty: true },
      {
        _id: 'cp_created_m',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        isCommonProperty: true,
      },
      {
        _id: 'cp_edited_m',
        name: 'editDate',
        label: 'Date modified',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [],
  },
];

export const datavizRelationTypes: RelationshipTypesType[] = [
  { _id: 'rel_owner', name: 'Current owner' },
];

export const carsByColorDto: DatavizDataDTO = {
  datavizId: DATAVIZ_CARS_BY_COLOR_ID,
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: {
    totalEntities: 248,
    truncated: false,
    queryDurationMs: 120,
  },
  series: [
    {
      id: 'colors',
      label: 'Colors',
      points: [
        { key: 'color_black', label: 'Black', value: 78, color: '#1a1a1a' },
        { key: 'color_white', label: 'White', value: 63, color: '#f5f5f5' },
        { key: 'color_silver', label: 'Silver', value: 42, color: '#c0c0c0' },
        { key: 'color_red', label: 'Red', value: 28, color: '#e74c3c' },
        { key: 'color_blue', label: 'Blue', value: 22, color: '#3498db' },
        { key: 'color_other', label: 'Other', value: 15, color: '#95a5a6' },
      ],
    },
  ],
};

export const yearHistogramDto: DatavizDataDTO = {
  datavizId: DATAVIZ_CARS_BY_COLOR_ID,
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: {
    totalEntities: 248,
    truncated: false,
    queryDurationMs: 95,
  },
  series: [
    {
      id: 'year',
      label: 'Year',
      points: [
        { key: '2020', label: '2020', value: 45 },
        { key: '2021', label: '2021', value: 62 },
        { key: '2022', label: '2022', value: 78 },
        { key: '2023', label: '2023', value: 41 },
        { key: '2024', label: '2024', value: 22 },
      ],
    },
  ],
};

export const personasSexByCountryDto: DatavizDataDTO = {
  datavizId: DATAVIZ_PERSONAS_SEX_COUNTRY_ID,
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: {
    totalEntities: 520,
    truncated: false,
    queryDurationMs: 135,
  },
  series: [
    {
      id: 'birth_country',
      label: 'Country of birth',
      points: [
        {
          key: 'country_ar',
          label: 'Argentina',
          value: 180,
          breakdown: [
            { key: 'sex_female', label: 'Female', value: 102, color: '#D63384' },
            { key: 'sex_male', label: 'Male', value: 72, color: '#4A90D9' },
            { key: 'sex_other', label: 'Other', value: 6, color: '#95A5A6' },
          ],
        },
        {
          key: 'country_cl',
          label: 'Chile',
          value: 95,
          breakdown: [
            { key: 'sex_female', label: 'Female', value: 48, color: '#D63384' },
            { key: 'sex_male', label: 'Male', value: 45, color: '#4A90D9' },
            { key: 'sex_other', label: 'Other', value: 2, color: '#95A5A6' },
          ],
        },
        {
          key: 'country_co',
          label: 'Colombia',
          value: 130,
          breakdown: [
            { key: 'sex_female', label: 'Female', value: 71, color: '#D63384' },
            { key: 'sex_male', label: 'Male', value: 55, color: '#4A90D9' },
            { key: 'sex_other', label: 'Other', value: 4, color: '#95A5A6' },
          ],
        },
        {
          key: 'country_mx',
          label: 'Mexico',
          value: 88,
          breakdown: [
            { key: 'sex_female', label: 'Female', value: 44, color: '#D63384' },
            { key: 'sex_male', label: 'Male', value: 41, color: '#4A90D9' },
            { key: 'sex_other', label: 'Other', value: 3, color: '#95A5A6' },
          ],
        },
        {
          key: 'country_other',
          label: 'Other',
          value: 27,
          breakdown: [
            { key: 'sex_female', label: 'Female', value: 14, color: '#D63384' },
            { key: 'sex_male', label: 'Male', value: 11, color: '#4A90D9' },
            { key: 'sex_other', label: 'Other', value: 2, color: '#95A5A6' },
          ],
        },
      ],
    },
  ],
};

export const multiSourceByTemplateDto: DatavizDataDTO = {
  datavizId: DATAVIZ_CARS_BY_COLOR_ID,
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: {
    totalEntities: 412,
    truncated: false,
    queryDurationMs: 140,
  },
  series: [
    {
      id: 'template',
      label: 'Entity type',
      points: [
        { key: DATAVIZ_CARS_TEMPLATE_ID, label: 'Cars', value: 248, color: '#4A90D9' },
        { key: 'tpl_owners', label: 'Owners', value: 164, color: '#7B68EE' },
      ],
    },
  ],
};

export const mileageBarDto: DatavizDataDTO = {
  datavizId: DATAVIZ_CARS_BY_COLOR_ID,
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: {
    totalEntities: 248,
    truncated: false,
    queryDurationMs: 88,
  },
  series: [
    {
      id: 'mileage',
      label: 'Mileage ranges',
      points: [
        { key: '0-50k', label: '0–50k', value: 89 },
        { key: '50k-100k', label: '50k–100k', value: 72 },
        { key: '100k-150k', label: '100k–150k', value: 54 },
        { key: '150k+', label: '150k+', value: 33 },
      ],
    },
  ],
};

export const createDefaultDatavizDefinition = (
  overrides?: Partial<DatavizDefinition>
): DatavizDefinition => ({
  id: DATAVIZ_CARS_BY_COLOR_ID,
  name: 'Cars by color',
  description: 'Count of cars by their main color.',
  status: 'draft',
  query: {
    sources: [{ templateId: DATAVIZ_CARS_TEMPLATE_ID, alias: 'cars' }],
    dimensions: [
      {
        property: 'colors',
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: 'count_desc',
        maxBuckets: 10,
      },
    ],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: {
    type: 'pie',
    showLegend: true,
    showLabels: true,
    showTooltip: true,
    pieOptions: {
      labelFormat: 'percentage',
      maxSlices: 10,
      othersLabel: 'Other',
    },
  },
  appearance: {
    colorMode: 'from_data',
    themeColors: { background: '#ffffff', foreground: '#1a1a1a' },
  },
  refresh: {
    refreshMode: 'live',
  },
  createdAt: '2025-05-28T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createEmptyDatavizDefinition = (): DatavizDefinition => ({
  id: 'dv_new',
  name: 'Untitled visualization',
  description: '',
  status: 'draft',
  query: {
    sources: [{ templateId: DATAVIZ_CARS_TEMPLATE_ID }],
    dimensions: [],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: {
    type: 'pie',
    showLegend: true,
    showTooltip: true,
    showLabels: true,
  },
  appearance: {
    colorMode: 'from_data',
  },
  refresh: {
    refreshMode: 'live',
  },
});

export const createMultiSourceDefinition = (): DatavizDefinition => ({
  ...createDefaultDatavizDefinition({
    id: 'dv_multi_source',
    name: 'Entities by type',
    description: 'Count across Cars and Owners templates.',
  }),
  query: {
    sources: [
      { templateId: DATAVIZ_CARS_TEMPLATE_ID, alias: 'cars' },
      { templateId: 'tpl_owners', alias: 'owners' },
    ],
    join: { type: 'union' },
    dimensions: [
      {
        property: TEMPLATE_DIMENSION_PROPERTY,
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: 'count_desc',
        maxBuckets: 10,
      },
    ],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: { type: 'bar', showLegend: true, showTooltip: true, showLabels: true },
  appearance: { colorMode: 'template', themeColors: { background: '#ffffff', foreground: '#1a1a1a' } },
});

export const createWithFiltersDefinition = (): DatavizDefinition => ({
  ...createDefaultDatavizDefinition(),
  query: {
    ...createDefaultDatavizDefinition().query,
    filters: [
      {
        id: 'filter_year',
        property: 'year',
        propertyType: 'date',
        operator: 'gte',
        from: '2020-01-01',
      },
    ],
  },
});

export const createPersonasSexByCountryDefinition = (): DatavizDefinition => ({
  id: DATAVIZ_PERSONAS_SEX_COUNTRY_ID,
  name: 'Personas by country and sex',
  description: 'Count of people by country of birth, split by sex.',
  status: 'draft',
  query: {
    sources: [{ templateId: DATAVIZ_PERSONAS_TEMPLATE_ID, alias: 'personas' }],
    dimensions: [
      {
        property: 'birth_country',
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: 'count_desc',
        maxBuckets: 10,
      },
      {
        property: 'sex',
        propertyType: 'select',
        bucketStrategy: 'terms',
        sort: 'label_asc',
        maxBuckets: 10,
      },
    ],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: {
    type: 'stacked_bar',
    stacked: true,
    showLegend: true,
    showTooltip: true,
    showLabels: false,
  },
  appearance: {
    colorMode: 'from_data',
    themeColors: { background: '#ffffff', foreground: '#1a1a1a' },
  },
  refresh: { refreshMode: 'live' },
});

export const createCustomColorsDefinition = (): DatavizDefinition => ({
  ...createDefaultDatavizDefinition(),
  appearance: {
    colorMode: 'custom',
    valueColorMap: { color_red: '#ff0000' },
    themeColors: { background: '#ffffff', foreground: '#1a1a1a' },
  },
});
