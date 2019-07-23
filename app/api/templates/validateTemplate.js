import validate from 'validate.js';
import createError from 'api/utils/Error';

validate.validators.duplicatedLabels = (properties, options, key, template) => {
  const labels = {};
  const titleProperty = template.commonProperties.find(p => p.name === 'title');
  const allProperties = [titleProperty, ...properties];
  allProperties.forEach((property) => {
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
      labels.push(property.label);
    }
  });

  if (labels.length) {
    return { message: 'duplicated_relationships', value: labels };
  }
};

validate.validators.requiredInheritedProperty = (properties) => {
  const labels = [];
  properties.forEach((property) => {
    if (property.inherit && !property.inheritProperty) {
      labels.push(property.label);
    }
  });

  if (labels.length) {
    return { message: 'required_inherited_property', value: labels };
  }
};

const validateTemplate = template => new Promise((resolve, reject) => {
  const errors = validate(template, {
      properties: {
        duplicatedLabels: true,
        duplicatedRelationship: true,
        requiredInheritedProperty: true,
      }
  });

  if (errors) {
    const message = errors.properties.map(error => `${error.message}: ${error.value.join(', ')}`).join('. ');
    reject(createError(message, 400));
  }

  resolve();
});

export default validateTemplate;
