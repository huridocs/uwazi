import comonProperties from 'shared/comonProperties';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { queryToFilter } from './publishedStatusFilter';

function getOptions(property, thesauris) {
  const matchingTHesauri = thesauris.find(thesauri => thesauri._id === property.content);
  return matchingTHesauri ? matchingTHesauri.values : null;
}

export function populateOptions(filters, thesauris) {
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

function URLQueryToState(query, templates, _thesauris, _relationTypes, forcedProps = []) {
  let properties = comonProperties.comonFilters(templates, query.types, forcedProps);
  if (!query.types || !query.types.length) {
    properties = comonProperties.defaultFilters(templates, forcedProps);
  }

  const {
    searchTerm = '',
    filters = {},
    sort = prioritySortingCriteria.get().sort,
    order = prioritySortingCriteria.get().order,
    userSelectedSorting,
    includeUnpublished = false,
    unpublished = false,
    allAggregations = false,
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

      property.totalPossibleOptions = propertyAggregations.count;
    }

    return property;
  });
}

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations,
};
