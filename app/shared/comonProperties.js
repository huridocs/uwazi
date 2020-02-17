function sameProperty(prop1, prop2) {
  return prop1.name === prop2.name && prop1.type === prop2.type && prop1.content === prop2.content;
}

function templateHasProperty(template, property) {
  return template.properties.filter(prop => sameProperty(prop, property)).length;
}

function allTemplatesHaveIt(templates, property) {
  return templates.reduce(
    (allHaveIt, template) => allHaveIt && templateHasProperty(template, property),
    true
  );
}

const comonProperties = (templates, documentTypes = []) => {
  const properties = [];
  const selectedTemplates = templates.filter(template =>
    documentTypes.includes(template._id.toString())
  );

  if (selectedTemplates.length) {
    selectedTemplates[0].properties.forEach(_property => {
      if (allTemplatesHaveIt(selectedTemplates, _property)) {
        const property = selectedTemplates.reduce((result, tmpl) => {
          const prop = tmpl.properties.find(_prop => sameProperty(_prop, _property), {});
          return prop.required ? prop : result;
        }, _property);
        properties.push(Object.assign({}, property));
      }
    });
  }
  return properties;
};

const comonFilters = (templates, relationTypes, documentTypes = []) => {
  const result = [];
  comonProperties(templates, documentTypes)
    .filter(prop => prop.filter || prop.type === 'relationshipfilter')
    .forEach(property => {
      if (property.type === 'relationshipfilter') {
        const relationType = relationTypes.find(
          template => template._id.toString() === property.relationType.toString()
        );
        property.filters = relationType.properties.filter(prop => prop.filter);
      }
      result.push(property);
    });

  return result;
};

const defaultFilters = templates =>
  templates.reduce((filters, template) => {
    template.properties.forEach(prop => {
      if (prop.filter && prop.defaultfilter && !filters.find(_prop => sameProperty(prop, _prop))) {
        filters.push(prop);
      }
    });
    return filters;
  }, []);

const allUniqueProperties = templates =>
  templates
    .reduce((filters, template) => {
      template.properties.forEach(prop => {
        if (!filters.find(_prop => sameProperty(prop, _prop))) {
          filters.push(prop);
        }
      });
      return filters;
    }, [])
    .filter(p => p.type !== 'relationshipfilter');

const textFields = templates =>
  allUniqueProperties(templates).filter(
    property => property.type === 'text' || property.type === 'markdown'
  );

export default {
  comonProperties,
  comonFilters,
  defaultFilters,
  allUniqueProperties,
  textFields,
};
