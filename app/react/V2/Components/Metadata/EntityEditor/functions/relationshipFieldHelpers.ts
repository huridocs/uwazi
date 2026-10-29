import { createElement } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { preloadOptionsLimit } from '#shared/config.js';
import { lookup as lookupEntities } from '#V2/api/search/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { relationshipGroupKey } from '../../relationshipInherit.js';
import type { MultiselectListOption } from '../../../Forms/index.js';
import type { DisplayProperty } from './relationshipGrouping.js';
import { thesaurusFreshLabel } from './thesaurusOptionLabel.js';

type MergeRelationshipLookupArgs = {
  property: DisplayProperty;
  selectedValues: MetadataValue[];
  lookedUpOptions?: MultiselectListOption[];
  cache: Map<string, MultiselectListOption[]>;
  includeCachedOptions?: boolean;
};

type RelationshipLookupSearchArgs = Omit<MergeRelationshipLookupArgs, 'cache'>;

const DEFAULT_RELATIONSHIP_LOOKUP_LIMIT = preloadOptionsLimit();

type RelationshipLookupPage = {
  options: { value: string; label: string }[];
  total: number;
};

type RelationshipLookup = (params: {
  search: string;
  template?: string;
  limit?: number;
  offset?: number;
}) => Promise<RelationshipLookupPage>;

const relationshipListOptions = (page: RelationshipLookupPage): MultiselectListOption[] =>
  page.options.map(option => ({
    label: option.label,
    searchLabel: option.label,
    value: option.value,
  }));

const thesaurusToOptions = (
  thesauri: ClientThesaurus[],
  property: { content?: string },
  freshIds?: ReadonlySet<string>
): MultiselectListOption[] => {
  const thesaurus = thesauri.find(item => item._id === property.content);
  if (!thesaurus) {
    return [];
  }

  const labelFor = (label: string, id?: string) =>
    id && freshIds?.has(id)
      ? thesaurusFreshLabel(label, thesaurus._id)
      : createElement(Translate, { context: thesaurus._id }, label);

  const searchLabelFor = (label: string) => t(thesaurus._id, label, null, false);

  return thesaurus.values.map(value => ({
    label: labelFor(value.label, value.id),
    searchLabel: searchLabelFor(value.label),
    value: value.id || value.label,
    items: value.values?.map(child => ({
      label: labelFor(child.label, child.id),
      searchLabel: searchLabelFor(child.label),
      value: child.id || child.label,
    })),
  }));
};

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
  offset,
}: {
  search: string;
  template?: string;
  limit?: number;
  offset?: number;
}): Promise<RelationshipLookupPage> => {
  const response = await lookupEntities({
    entityTitle: search,
    template,
    limit,
    ...(offset ? { offset } : {}),
  });

  if (!response || !('rows' in response) || !Array.isArray(response.rows)) {
    return { options: [], total: 0 };
  }

  const options = response.rows.flatMap(row => {
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

  return { options, total: typeof response.count === 'number' ? response.count : options.length };
};

export {
  thesaurusToOptions,
  mergeRelationshipLookupOptions,
  relationshipListOptions,
  DEFAULT_RELATIONSHIP_LOOKUP_LIMIT,
  defaultRelationshipLookup,
};
export type { RelationshipLookup, RelationshipLookupPage, RelationshipLookupSearchArgs };
