import { comonProperties, defaultFilters } from 'shared/comonProperties';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

function getOptions(property, thesauris) {
  const matchingTHesauri = thesauris.find(thesauri => thesauri._id === property.content);
  return matchingTHesauri ? matchingTHesauri.values : null;
}

export function populateOptions(filters, thesauris) {
  return filters.map((property) => {
    if (property.content) {
      return Object.assign(property, { options: getOptions(property, thesauris) });
    }

    if (!property.content && property.type === 'relationship') {
      return Object.assign(property, {
        options: thesauris.filter(t => t.type === 'template')
        .reduce((options, thesauri) => options.concat(thesauri.values), [])
      });
    }

    return property;
  });
}

function URLQueryToState(query, templates, thesauris) {
  let properties = comonProperties(templates, query.types)
  .filter(prop => prop.filter);

  if (!query.types || !query.types.length) {
    properties = defaultFilters(templates);
  }

  const {
    searchTerm = '',
    filters = {},
    sort = prioritySortingCriteria.get().sort,
    order = prioritySortingCriteria.get().order,
    userSelectedSorting
  } = query;
  properties = populateOptions(properties, thesauris).map((property) => {
    let defaultValue = {};

    if (property.type === 'text') {
      defaultValue = '';
    }

    filters[property.name] = filters[property.name] ? filters[property.name] : defaultValue;
    return property;
  });
  return { properties, search: { searchTerm, filters, order, sort, userSelectedSorting } };
}

const getOptionCount = (aggregations, optionId, name) => {
  let aggregation;
  if (aggregations.all && aggregations.all[name]) {
    aggregation = aggregations.all[name].buckets.find(bucket => bucket.key.toString() === optionId.toString());
  }
  return aggregation ? aggregation.filtered.doc_count : 0;
};

export function parseWithAggregations(filters, aggregations) {
  return filters.map((_property) => {
    const property = Object.assign({}, _property);
    if (property.options && property.options.length) {
      property.options = property.options.map(option => Object.assign(option, {
        results: getOptionCount(aggregations, option.id, property.name)
      }));
    }

    return property;
  });
}

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations
};
