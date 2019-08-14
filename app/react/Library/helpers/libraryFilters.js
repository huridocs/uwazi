import comonProperties from 'shared/comonProperties';
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

    if (!property.content && property.type === 'relationshipfilter') {
      property.filters = populateOptions(property.filters, thesauris);
    }

    return property;
  });
}

function URLQueryToState(query, templates, thesauris, relationTypes) {
  let properties = comonProperties.comonFilters(templates, relationTypes, query.types);

  if (!query.types || !query.types.length) {
    properties = comonProperties.defaultFilters(templates);
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

    if (property.type === 'text' || property.type === 'markdown') {
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

export function parseWithAggregations(filters, aggregations, showNoValue = true) {
  return filters.map((_property) => {
    const property = Object.assign({}, _property);
    if (property.options && property.options.length) {
      if (showNoValue) {
        property.options.push({ id: 'missing', label: 'No Value', noValueKey: true });
      }
      property.options = property.options.map((_option) => {
        const option = Object.assign(_option, { results: getOptionCount(aggregations, _option.id, property.name) });
        if (option.values) {
          option.values = option.values.map((_opt) => {
            _opt.results = getOptionCount(aggregations, _opt.id, property.name);
            return _opt;
          });
        }
        return option;
      }).filter(opt => opt.results);
    }
    if (property.filters) {
      property.filters = parseWithAggregations(property.filters, aggregations, showNoValue);
    }
    return property;
  });
}

export default {
  URLQueryToState,
  populateOptions,
  parseWithAggregations
};
