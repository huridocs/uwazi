import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import {comonProperties, defaultFilters} from 'shared/comonProperties';

function getOptions(property, thesauris) {
  let matchingTHesauri = thesauris.find((thesauri) => {
    return thesauri._id === property.content;
  });

  if (matchingTHesauri) {
    return matchingTHesauri.values;
  }
}

export function populateOptions(filters, thesauris) {
  filters.map((property) => {
    if (property.content) {
      property.options = getOptions(property, thesauris);
    }

    if (!property.content && property.type === 'relationship') {
      property.options = Array.prototype.concat(...thesauris.filter((thesauri) => thesauri.type === 'template'));
    }

    return property;
  });

  return filters;
}

export function URLQueryToState(query, templates, thesauris) {
  let properties = comonProperties(templates, query.types)
  .filter((prop) => prop.filter);

  if (!query.types || !query.types.length) {
    properties = defaultFilters(templates);
  }

  let {
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
  return {properties, search: {searchTerm, filters, order, sort, userSelectedSorting}};
}

export function parseWithAggregations(filters, aggregations) {
  return filters.map((_property) => {
    let property = Object.assign({}, _property);
    if (property.options && property.options.length) {
      property.options = property.options.map((option) => {
        option.results = 0;
        let aggregation;
        if (aggregations.all && aggregations.all[property.name]) {
          aggregation = aggregations.all[property.name].buckets
          .find((bucket) => bucket.key.toString() === option.id.toString());
        }

        if (aggregation) {
          option.results = aggregation.filtered.doc_count;
        }

        return option;
      });
    }

    return property;
  });
}

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations
};
