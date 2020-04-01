import comonProperties from 'shared/comonProperties';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

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

function URLQueryToState(query, templates) {
  let properties = comonProperties.comonFilters(templates, query.types);

  if (!query.types || !query.types.length) {
    properties = comonProperties.defaultFilters(templates);
  }

  const {
    searchTerm = '',
    filters = {},
    sort = prioritySortingCriteria.get().sort,
    order = prioritySortingCriteria.get().order,
    userSelectedSorting,
  } = query;
  properties = properties.map(property => {
    let defaultValue = {};

    if (property.type === 'text' || property.type === 'markdown') {
      defaultValue = '';
    }

    filters[property.name] = filters[property.name] ? filters[property.name] : defaultValue;
    return property;
  });
  return { properties, search: { searchTerm, filters, order, sort, userSelectedSorting } };
}

const normalizeBucket = bucket => {
  const normalizedBucket = {
    id: bucket.key,
    value: bucket.key,
    label: bucket.label,
    results: bucket.filtered.doc_count,
  };

  if (bucket.values) {
    normalizedBucket.options = bucket.values.map(normalizeBucket);
  }

  if (bucket.key === 'missing') {
    normalizedBucket.noValueKey = true;
  }

  return normalizedBucket;
};

export function parseWithAggregations(filters, aggregations, showNoValue = true) {
  return filters.map(_property => {
    const property = Object.assign({}, _property);
    const propertyAggregations = aggregations.all[property.name];
    if (propertyAggregations && propertyAggregations.buckets) {
      property.options = propertyAggregations.buckets
        .map(normalizeBucket)
        .filter(opt => opt.results || (!showNoValue && opt.value === 'missing'));
    }

    return property;
  });
}

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations,
};
