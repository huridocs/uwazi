import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import {comonProperties} from 'shared/comonProperties';

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

    return property;
  });

  return filters;
}

export function URLQueryToState(query, templates, thesauris) {
  let properties = comonProperties(templates, query.types)
  .filter((prop) => prop.filter);

  let {searchTerm = '', filters = {}, sort = prioritySortingCriteria.get().sort, order = prioritySortingCriteria.get().order} = query;
  properties = populateOptions(properties, thesauris).map((property) => {
    if (filters[property.name]) {
      property.active = true;
    }
    let defaultValue = {};

    if (property.type === 'text') {
      defaultValue = '';
    }

    filters[property.name] = filters[property.name] ? filters[property.name] : defaultValue;
    return property;
  });
  return {properties, search: {searchTerm, filters, order, sort}};
}

export function parseWithAggregations(filters, aggregations) {
  return filters.map((_property) => {
    let property = Object.assign({}, _property);
    if (property.content) {
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
