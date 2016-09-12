function sameProperty(prop1, prop2) {
  return prop1.name === prop2.name && prop1.type === prop2.type && prop1.content === prop2.content;
}

function templateHasProperty(template, property) {
  return template.properties.filter((prop) => {
    return sameProperty(prop, property) && prop.filter;
  }).length;
}

function allTemplatesHaveIt(templates, property) {
  return templates.reduce((allHaveIt, template) => {
    return allHaveIt && templateHasProperty(template, property);
  }, true);
}

function getOptions(property, thesauris) {
  let matchingTHesauri = thesauris.find((thesauri) => {
    return thesauri._id === property.content;
  });

  if (matchingTHesauri) {
    return matchingTHesauri.values;
  }
}

export function libraryFilters(templates, documentTypes = []) {
  let filters = [];
  let selectedTemplates = templates.filter((template) => {
    return documentTypes.includes(template._id);
  });

  if (selectedTemplates.length) {
    selectedTemplates[0].properties.forEach((property) => {
      if (property.filter && allTemplatesHaveIt(selectedTemplates, property)) {
        filters.push(Object.assign({}, property));
      }
    });
  }

  return filters;
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
  let properties = libraryFilters(templates, query.types);
  let {searchTerm, filters, order = 'desc', sort = 'title.raw'} = query;
  properties = populateOptions(properties, thesauris).map((property) => {
    if (filters[property.name]) {
      property.active = true;
    }
    filters[property.name] = filters[property.name] ? filters[property.name].value : [];
    return property;
  });

  return {properties, search: {searchTerm, filters, order, sort}};
}

export function parseWithAggregations(filters, aggregations) {
  return filters.map((property) => {
    if (property.content) {
      property.options = property.options.map((option) => {
        let aggregation;
        if (aggregations[property.name]) {
          aggregation = aggregations[property.name].buckets
          .find((bucket) => bucket.key.toString() === option.id.toString());
        }

        if (aggregation) {
          option.results = aggregation.filtered.doc_count;
        }

        return option;
      }).filter((option) => option.results);
    }

    return property;
  });
}

export default {
  libraryFilters,
  URLQueryToState,
  populateOptions,
  parseWithAggregations
};
