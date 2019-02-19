import validate from 'validate.js';

validate.validators.duplicatedLabels = (properties) => {
  const labels = {};
  properties.forEach((property) => {
    labels[property.label.toLowerCase()] = (labels[property.label.toLowerCase()] || 0) + 1;
  });

  const duplicatedLabels = Object.keys(labels).filter(label => labels[label] > 1);

  if (duplicatedLabels.length) {
    return { message: 'duplicated_labels', value: duplicatedLabels };
  }
};

const validateTemplate = template => new Promise((resolve, reject) => {
  const errors = validate(template, {
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

export default validateTemplate;
