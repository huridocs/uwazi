function sameProperty(prop1, prop2) {
  return prop1.name === prop2.name && prop1.type === prop2.type && prop1.content === prop2.content;
}

function templateHasProperty(template, property) {
  return template.properties.filter((prop) => {
    return sameProperty(prop, property);
  }).length;
}

function allTemplatesHaveIt(templates, property) {
  return templates.reduce((allHaveIt, template) => {
    return allHaveIt && templateHasProperty(template, property);
  }, true);
}

export default {
  comonProperties: (templates, documentTypes = []) => {
    let properties = [];
    let selectedTemplates = templates.filter((template) => {
      return documentTypes.includes(template._id.toString());
    });

    if (selectedTemplates.length) {
      selectedTemplates[0].properties.forEach((_property) => {
        if (allTemplatesHaveIt(selectedTemplates, _property)) {
          let property = selectedTemplates.reduce((result, tmpl) => {
            let prop = tmpl.properties.find((_prop) => sameProperty(_prop, _property), {});
            return prop.required ? prop : result;
          }, _property);
          properties.push(Object.assign({}, property));
        }
      });
    }
    return properties;
  }
};
