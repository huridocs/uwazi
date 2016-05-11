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

export function libraryFilters(templates, documentTypes, thesauris) {
  let filters = [];
  let selectedTemplates = templates.filter((template) => {
    return documentTypes[template._id];
  });

  if (selectedTemplates.length) {
    selectedTemplates[0].properties.forEach((property) => {
      if (property.filter && allTemplatesHaveIt(selectedTemplates, property)) {
        filters.push(Object.assign({}, property));
      }
    });
  }

  filters.map((property) => {
    if (property.content) {
      property.options = getOptions(property, thesauris);
    }
    return property;
  });

  return filters;
}

export function generateDocumentTypes(templates, value = false) {
  return templates.reduce((docTypes, templ) => {
    docTypes[templ._id] = value;
    return docTypes;
  }, {});
}

export default {
  generateDocumentTypes,
  libraryFilters
};
