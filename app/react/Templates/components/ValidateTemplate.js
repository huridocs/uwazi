function validateName(templates, id) {
  return {
    required: (val) => val && val.trim() !== '',
    duplicated: (val) => {
      return !templates.find((template) => {
        return template._id !== id && template.name.trim().toLowerCase() === val.trim().toLowerCase();
      });
    }
  };
}

export function validateDuplicatedLabel(property, properties) {
  return properties.reduce((validity, prop) => {
    const sameProperty = (prop._id || prop.localID) === (property._id || property.localID);
    const differentLabel = prop.label.trim().toLowerCase() !== property.label.trim().toLowerCase();

    return validity && (sameProperty || differentLabel);
  }, true);
}

export default function (properties, templates, id) {
  let validator = {
    '': {},
    name: validateName(templates, id)
  };

  properties.forEach((property, index) => {
    validator[''][`properties.${index}.label.required`] = (template) => {
      if (!template.properties[index]) {
        return true;
      }
      let label = template.properties[index].label;
      return label && label.trim() !== '';
    };

    validator[''][`properties.${index}.label.duplicated`] = (template) => {
      if (!template.properties[index]) {
        return true;
      }
      let prop = template.properties[index];
      return validateDuplicatedLabel(prop, template.properties);
    };

    validator[''][`properties.${index}.content.required`] = (template) => {
      if (!template.properties[index] || template.properties[index].type !== 'select' || template.properties[index].type !== 'multiselect') {
        return true;
      }
      let content = template.properties[index].content;
      return content && content.trim() !== '';
    };

    validator[''][`properties.${index}.relationType.required`] = (template) => {
      if (!template.properties[index] || template.properties[index].type !== 'relationship') {
        return true;
      }
      let relationType = template.properties[index].relationType;
      return relationType && relationType.trim() !== '';
    };
  });

  return validator;
}
