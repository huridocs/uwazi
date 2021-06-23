import { ObjectId } from 'mongodb';
import templates from './templates';

const SHOULD_NOT_TRIGGER_REINDEX = [
  'name',
  'color',
  'property.filter',
  'property.defaultfilter',
  'property.noLabel',
  'property.showIncard',
  'property.required',
];

function compareTemplateProperties(updatedProperties, originalProperties) {
  const changedProps = [];
  originalProperties.forEach(originalProperty => {
    // console.log('iterating original properties: ', originalProperty);
    const updatedProperty = updatedProperties.find(
      prop => prop._id === ObjectId(originalProperty._id).toString()
    );

    if (!updatedProperty) {
      changedProps.push('PROPERTY_DELETED');
      return;
    }

    Object.keys(originalProperty).forEach(originalKey => {
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
  console.log(updatedTemplate);
  if (updatedTemplate._id) {
    const changedProperties = [];
    const [originalTemplate] = await templates.get({ _id: updatedTemplate._id });
    const originalKeys = Object.keys(originalTemplate);

    // Compare shallow object properties
    originalKeys.forEach(key => {
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
    console.log(changedProperties);
    return checkIfFilterConditionsMet(changedProperties);
  }
  return false;
}

