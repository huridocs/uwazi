import type {
  DatavizFilter,
  DatavizRuntimeFilter,
  DatavizRuntimeFilterValue,
  PropertyTypeForDataviz,
} from '#shared/types/datavizSchema.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';

const DATE_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>([
  'date',
  'multidate',
  'daterange',
  'multidaterange',
]);

const NUMERIC_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>(['numeric']);
const THESAURI_PROPERTY_TYPES = new Set<PropertyTypeForDataviz>(['select', 'multiselect']);

type FilterCapability = 'numeric' | 'date' | 'thesaurus' | 'eq';

type TemplateProperty = {
  name: string;
  type?: string;
  content?: string;
};

const toUnixSeconds = (input?: number | string): number | undefined => {
  if (input === undefined || input === null || input === '') {
    return undefined;
  }
  if (typeof input === 'number') {
    return input;
  }
  const parsed = Date.parse(input);
  return Number.isNaN(parsed) ? undefined : Math.floor(parsed / 1000);
};

const inferCapability = (value: DatavizRuntimeFilterValue): FilterCapability | null => {
  if (value.values?.length) {
    return 'thesaurus';
  }
  if (value.from !== undefined || value.to !== undefined) {
    return 'date';
  }
  if (value.min !== undefined || value.max !== undefined) {
    return 'numeric';
  }
  if (value.value !== undefined) {
    return 'eq';
  }
  return null;
};

const propertyMatchesCapability = (
  property: TemplateProperty,
  capability: FilterCapability
): property is TemplateProperty & { type: PropertyTypeForDataviz } => {
  if (!property.type) {
    return false;
  }
  const type = property.type as PropertyTypeForDataviz;
  if (capability === 'numeric') {
    return NUMERIC_PROPERTY_TYPES.has(type);
  }
  if (capability === 'date') {
    return DATE_PROPERTY_TYPES.has(type);
  }
  if (capability === 'thesaurus') {
    return THESAURI_PROPERTY_TYPES.has(type);
  }
  return true;
};

const buildOperator = (
  value: DatavizRuntimeFilterValue,
  capability: FilterCapability
): DatavizFilter['operator'] | null => {
  if (capability === 'thesaurus') {
    return value.values?.length ? 'in' : null;
  }
  if (capability === 'eq') {
    return value.value !== undefined ? 'eq' : null;
  }

  const from = capability === 'date' ? toUnixSeconds(value.from) : value.min;
  const to = capability === 'date' ? toUnixSeconds(value.to) : value.max;

  if (from !== undefined && to !== undefined) {
    return 'between';
  }
  if (from !== undefined) {
    return 'gte';
  }
  if (to !== undefined) {
    return 'lte';
  }
  return null;
};

const resolvePropertyForSource = (
  propertyHint: string,
  capability: FilterCapability,
  properties: TemplateProperty[]
): (TemplateProperty & { type: PropertyTypeForDataviz }) | null => {
  const exact = properties.find(property => property.name === propertyHint);
  if (exact?.type && propertyMatchesCapability(exact, capability)) {
    return exact as TemplateProperty & { type: PropertyTypeForDataviz };
  }
  if (exact?.type && capability === 'eq') {
    return exact as TemplateProperty & { type: PropertyTypeForDataviz };
  }

  const compatible = properties.filter(property => propertyMatchesCapability(property, capability));
  if (compatible.length === 1) {
    return compatible[0] as TemplateProperty & { type: PropertyTypeForDataviz };
  }

  return null;
};

const toDatavizFilter = (
  runtime: DatavizRuntimeFilter,
  sourceAlias: string | undefined,
  property: TemplateProperty & { type: PropertyTypeForDataviz },
  capability: FilterCapability,
  operator: DatavizFilter['operator']
): DatavizFilter => {
  const filter: DatavizFilter = {
    id: `external:${runtime.property}:${sourceAlias ?? 'all'}:${property.name}`,
    scope: 'external',
    sourceAlias,
    property: property.name,
    propertyType: property.type,
    operator,
  };

  if (capability === 'thesaurus') {
    filter.values = runtime.value.values;
    return filter;
  }

  if (capability === 'eq') {
    filter.value = runtime.value.value;
    return filter;
  }

  if (capability === 'date') {
    const from = toUnixSeconds(runtime.value.from);
    const to = toUnixSeconds(runtime.value.to);
    if (from !== undefined) {
      filter.from = from;
    }
    if (to !== undefined) {
      filter.to = to;
    }
    return filter;
  }

  if (runtime.value.min !== undefined) {
    filter.from = runtime.value.min;
  }
  if (runtime.value.max !== undefined) {
    filter.to = runtime.value.max;
  }
  return filter;
};

const resolveExternalFilters = async (
  dataviz: Dataviz,
  runtimeFilters: DatavizRuntimeFilter[] | undefined,
  deps: { templatesDS: TemplatesDataSource }
): Promise<DatavizFilter[]> => {
  if (!runtimeFilters?.length || dataviz.isManual) {
    return [];
  }

  const templates = await deps.templatesDS.getByIds(
    dataviz.query.sources.map(source => source.templateId)
  );
  const templatesById = new Map(templates.map(template => [template.id, template]));

  return runtimeFilters.flatMap(runtime => {
    const capability = inferCapability(runtime.value);
    if (!capability || !runtime.property) {
      return [];
    }

    const operator = buildOperator(runtime.value, capability);
    if (!operator) {
      return [];
    }

    return dataviz.query.sources.flatMap(source => {
      const template = templatesById.get(source.templateId);
      const properties = (template?.properties ?? []) as TemplateProperty[];
      const matched = resolvePropertyForSource(runtime.property, capability, properties);
      if (!matched) {
        return [];
      }

      return [toDatavizFilter(runtime, source.alias, matched, capability, operator)];
    });
  });
};

export { resolveExternalFilters };
