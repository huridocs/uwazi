import validate from 'validate.js';

validate.validators.duplicatedLabels = (properties) => {
  let labels = {};
  properties.forEach((property) => {
    labels[property.label.toLowerCase()] = (labels[property.label.toLowerCase()] || 0) + 1;
  });

  let duplicatedLabels = Object.keys(labels).filter((label) => {
    return labels[label] > 1;
  });

  if (duplicatedLabels.length) {
    return {message: 'duplicated_labels', value: duplicatedLabels};
  }
};

let validateTemplate = (template) => {
  return new Promise((resolve, reject) => {
    let errors = validate(template, {
      properties: {
        duplicatedLabels: true
      }
    });

    if (errors) {
      errors.properties = errors.properties[0];
      reject(errors);
    }

    resolve();
  });
};

export default validateTemplate;
