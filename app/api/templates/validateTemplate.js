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

validate.validators.duplicatedRelationship = (properties) => {
  const labels = [];
  properties.forEach((property) => {
    const matchingProperty = properties.find((prop) => {
      const sameProperty = (prop._id || prop.localID) === (property._id || property.localID);
      const sameRelationType = prop.relationType && prop.relationType === property.relationType;
      const sameContent = prop.content === property.content;
      const isAnyTemplate = Boolean(!property.content) || Boolean(!prop.content);
      return (!sameProperty && sameRelationType && (sameContent || isAnyTemplate));
    });
    if (matchingProperty) {
      labels.push(property.label.toLowerCase());
    }
  });

  if (labels.length) {
    return { message: 'duplicated_relationships', value: labels };
  }
};

const validateTemplate = template => new Promise((resolve, reject) => {
  const errors = validate(template, {
      properties: {
        duplicatedLabels: true,
        duplicatedRelationship: true
      }
  });

  if (errors) {
    errors.properties = errors.properties[0];
    reject(errors);
  }

  resolve();
});

export default validateTemplate;
