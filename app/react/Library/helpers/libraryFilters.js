import comonProperties from 'shared/comonProperties';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { queryToFilter } from './publishedStatusFilter';

function getOptions(property, thesauris) {
  const matchingTHesauri = thesauris.find(thesauri => thesauri._id === property.content);
  return matchingTHesauri ? matchingTHesauri.values : null;
}

function populateOptions(filters, thesauris) {
  return filters.map(property => {
    if (property.content) {
      return Object.assign(property, { options: getOptions(property, thesauris) });
    }

    if (!property.content && property.type === 'relationship') {
      return Object.assign(property, {
        options: thesauris
          .filter(t => t.type === 'template')
          .reduce((options, thesauri) => options.concat(thesauri.values), []),
      });
    }

    return property;
  });
}

function URLQueryToState(query, templates, forcedProps = []) {
  let properties = comonProperties.comonFilters(templates, query.types, forcedProps);
  if (!query.types || !query.types.length) {
    properties = comonProperties.defaultFilters(templates, forcedProps);
  }

  let { sort, order } = prioritySortingCriteria.get();
  ({ sort = sort, order = order } = query);
  const {
    searchTerm = '',
    filters = {},
    userSelectedSorting,
    includeUnpublished = true,
    unpublished = false,
    allAggregations = false,
    treatAs = 'number',
  } = query;

  return {
    properties,
    search: {
      searchTerm,
      filters,
      customFilters: query.customFilters,
      sort,
      order,
      userSelectedSorting,
      treatAs,
      publishedStatus: queryToFilter(unpublished, includeUnpublished),
      allAggregations,
    },
  };
}

const normalizeBucket = bucket => {
  const normalizedBucket = {
    id: bucket.key,
    value: bucket.key,
    label: bucket.label,
    results: bucket.filtered.doc_count,
  };

  if (bucket.icon) {
    normalizedBucket.icon = bucket.icon;
  }

  if (bucket.values) {
    normalizedBucket.options = bucket.values.map(normalizeBucket);
  }

  if (bucket.key === 'missing') {
    normalizedBucket.noValueKey = true;
  }

  return normalizedBucket;
};

export function parseWithAggregations(filters, aggregations, showNoValue = true) {
  return filters.map(({ ...property }) => {
    const propertyAggregations = aggregations.all[property.name];
    if (propertyAggregations && propertyAggregations.buckets) {
      property.options = propertyAggregations.buckets
        .map(normalizeBucket)
        .filter(opt => opt.results || (!showNoValue && opt.value === 'missing'));
    }

    return property;
  });
}

export const prepareDefaultFilters = fields =>
  fields.map(field => {
    if (!field.defaultfilter || !field.options) {
      return field;
    }
    const filteredOptions = field.options.filter(option => option.id !== 'missing');
    return { ...field, options: filteredOptions };
  });

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations,
};

export { populateOptions };
