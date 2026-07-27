import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { lookup as lookupEntities } from '#V2/api/search/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { MultiselectListOption } from '../../../Forms/index.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';
import { relationshipGroupKey, type DisplayProperty } from './relationshipGrouping.js';

type InheritColumnTemplate = {
  _id: string;
  properties?: { _id?: string; label: string }[];
};

type InheritColumn = {
  label: string;
  cellsByEntityId: Record<string, string | undefined>;
};

type MergeRelationshipLookupArgs = {
  property: DisplayProperty;
  selectedValues: MetadataValue[];
  lookedUpOptions?: MultiselectListOption[];
  cache: Map<string, MultiselectListOption[]>;
  includeCachedOptions?: boolean;
};

const DEFAULT_RELATIONSHIP_LOOKUP_LIMIT = 50;

const thesaurusToOptions = (
  thesauri: ClientThesaurus[],
  property: FormMetadataProperty
): MultiselectListOption[] =>
  thesauri
    .find(thesaurus => thesaurus._id === property.content)
    ?.values.map(value => ({
      label: value.label,
      searchLabel: value.label,
      value: value.id || value.label,
      items: value.values?.map(child => ({
        label: child.label,
        searchLabel: child.label,
        value: child.id || child.label,
      })),
    })) || [];

const mergeRelationshipLookupOptions = ({
  property,
  selectedValues,
  lookedUpOptions = [],
  cache,
  includeCachedOptions = true,
}: MergeRelationshipLookupArgs): MultiselectListOption[] => {
  const cacheKey = relationshipGroupKey(property);
  const cachedOptions = includeCachedOptions ? (cache.get(cacheKey) ?? []) : [];
  const selectedOptions = selectedValues
    .filter(value => value?.value)
    .map(value => {
      const valueId = String(value.value);
      const cached = cachedOptions.find(option => option.value === valueId);
      const lookedUp = lookedUpOptions.find(option => option.value === valueId);
      const label =
        (typeof value.label === 'string' ? value.label : undefined) ||
        (typeof cached?.label === 'string' ? cached.label : undefined) ||
        (typeof lookedUp?.label === 'string' ? lookedUp.label : undefined) ||
        valueId;

      return {
        label,
        searchLabel: label.toLowerCase(),
        value: valueId,
      };
    });

  const merged = [...selectedOptions, ...cachedOptions, ...lookedUpOptions].filter(
    (option, index, options) => options.findIndex(other => other.value === option.value) === index
  );

  if (includeCachedOptions) {
    cache.set(cacheKey, merged);
  }

  return merged;
};

const defaultRelationshipLookup = async ({
  search,
  template,
  limit = DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
}: {
  search: string;
  template?: string;
  limit?: number;
}): Promise<{ value: string; label: string }[]> => {
  const response = await lookupEntities({
    entityTitle: search,
    template,
    limit,
  });

  if (!response || !('rows' in response) || !Array.isArray(response.rows)) {
    return [];
  }

  return response.rows.flatMap(row => {
    if (typeof row.sharedId !== 'string') {
      return [];
    }
    return [
      {
        value: row.sharedId,
        label: typeof row.title === 'string' && row.title ? row.title : row.sharedId,
      },
    ];
  });
};

const inheritedCellText = (
  values: { value?: unknown; inheritedValue?: { label?: string; value?: unknown }[] }[] | undefined,
  entityId: string
): string | undefined => {
  const row = values?.find(value => String(value.value ?? '') === entityId);
  if (!row?.inheritedValue?.length) return undefined;
  const parts = row.inheritedValue
    .map(item => {
      if (typeof item.label === 'string' && item.label.length > 0) return item.label;
      return typeof item.value === 'string' ? item.value : undefined;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(', ') : undefined;
};

const inheritColumnLabel = (
  property: FormMetadataProperty,
  templates: InheritColumnTemplate[]
): string => {
  const inheritPropertyId = property.inherit?.property;
  if (inheritPropertyId && property.content) {
    const targetTemplate = templates.find(template => template._id === property.content);
    const inheritedProperty = targetTemplate?.properties?.find(
      candidate => candidate._id === inheritPropertyId
    );
    if (inheritedProperty?.label) return inheritedProperty.label;
  }
  return property.label;
};

const buildInheritColumns = (
  property: DisplayProperty,
  metadataProperties: FormMetadataProperty[],
  templates: InheritColumnTemplate[],
  sourceMetadata?: Entity['metadata']
): InheritColumn[] =>
  metadataProperties
    .filter(
      candidate =>
        candidate.type === 'relationship' &&
        candidate.inherited &&
        candidate.content === property.content &&
        candidate.relationType === property.relationType
    )
    .map(candidate => {
      const values = sourceMetadata?.[candidate.name];
      const cellsByEntityId: Record<string, string | undefined> = {};
      (values ?? []).forEach(row => {
        const entityId = String(row.value ?? '');
        if (entityId) {
          cellsByEntityId[entityId] = inheritedCellText(values, entityId);
        }
      });
      return {
        label: inheritColumnLabel(candidate, templates),
        cellsByEntityId,
      };
    });

export {
  thesaurusToOptions,
  mergeRelationshipLookupOptions,
  DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
  defaultRelationshipLookup,
  buildInheritColumns,
  inheritedCellText,
  inheritColumnLabel,
};
export type { InheritColumn, InheritColumnTemplate };
