import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { lookup as lookupEntities } from '#V2/api/search/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import {
  buildInheritColumns,
  inheritColumnLabel,
  relationshipGroupKey,
  type InheritColumn,
  type InheritColumnTemplate,
  type RelationshipInheritColumn,
} from '../../relationshipInherit.js';
import type { MultiselectListOption } from '../../../Forms/index.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';
import type { DisplayProperty } from './relationshipGrouping.js';

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

export {
  thesaurusToOptions,
  mergeRelationshipLookupOptions,
  DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
  defaultRelationshipLookup,
  buildInheritColumns,
  inheritColumnLabel,
};
export type { RelationshipInheritColumn, InheritColumn, InheritColumnTemplate };
