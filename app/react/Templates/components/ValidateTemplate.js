function validateName() {
  return {
    required: (val) => val && val.trim() !== ''
  };
}

export function validateDuplicatedLabel(property, properties) {
  return properties.reduce((validity, prop) => {
    let differentLabel = prop.localID === property.localID || prop.label.trim().toLowerCase() !== property.label.trim().toLowerCase();
    return validity && differentLabel;
  }, true);
}

export default function (properties) {
  let validator = {
    '': {},
    name: validateName()
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
  });

  return validator;
}
