import templates from './templates';

const SHOULD_NOT_TRIGGER_REINDEX = [
  'name',
  'color',
  'properties.filter',
  'properties.defaultfilter',
  'properties.noLabel',
  'properties.showInCard',
  'properties.required',
  'properties.style',
  'properties.fullWidth',
  'properties.nestedProperties',
  'properties.localID',
  'commonProperties.filter',
  'commonProperties.defaultfilter',
  'commonProperties.noLabel',
  'commonProperties.showInCard',
  'commonProperties.required',
  'commonProperties.prioritySorting',
];

function compareTemplateProperties(updatedProperties, originalProperties) {
  const changedProps = [];
  const hasNewProperty = updatedProperties.find(prop => !prop.hasOwnProperty('_id'));

  if (hasNewProperty) {
    changedProps.push('PROPERTY_ADDED');
  }

  originalProperties.forEach(originalProperty => {
    const updatedProperty = updatedProperties.find(prop => prop.name === originalProperty.name);

    if (!updatedProperty) {
      changedProps.push('PROPERTY_DELETED');
      return;
    }

    Object.keys(updatedProperty).forEach(originalKey => {
      if (updatedProperty[originalKey] !== originalProperty[originalKey] && originalKey !== '_id') {
        changedProps.push(originalKey);
      }
    });
  });

  return changedProps;
}
function checkIfFilterConditionsMet(changedProperties) {
  let shouldReindex = false;
  changedProperties.forEach(property => {
    if (!SHOULD_NOT_TRIGGER_REINDEX.includes(property)) {
      shouldReindex = true;
    }
  });
  return shouldReindex;
}

export async function checkIfReindex(updatedTemplate) {
  if (updatedTemplate._id) {
    const changedProperties = [];
    const [originalTemplate] = await templates.get({ _id: updatedTemplate._id });
    const updatedKeys = Object.keys(updatedTemplate);

    // Compare shallow object properties
    updatedKeys.forEach(key => {
      if (Array.isArray(updatedTemplate[key])) {
        // Is a list of properties
        const props = compareTemplateProperties(updatedTemplate[key], originalTemplate[key]);
        props.forEach(propsKey => {
          changedProperties.push(`${key}.${propsKey}`);
        });
        return;
      }
      if (updatedTemplate[key] !== originalTemplate[key] && key !== '_id') {
        changedProperties.push(key);
      }
    });
    return checkIfFilterConditionsMet(changedProperties);
  }
  return false;
}
