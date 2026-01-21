import _ from 'lodash';

import templates from './templates.js';

const SHOULD_NOT_TRIGGER_REINDEX = [
  'name',
  'processing',
  'color',
  'entityViewPage',
  'properties.filter',
  'properties.defaultfilter',
  'properties.noLabel',
  'properties.showInCard',
  'properties.required',
  'properties.style',
  'properties.fullWidth',
  'properties.nestedProperties',
  'commonProperties.filter',
  'commonProperties.defaultfilter',
  'commonProperties.noLabel',
  'commonProperties.showInCard',
  'commonProperties.required',
  'commonProperties.prioritySorting',
];

function compareTemplateProperties(updatedProperties: any[], originalProperties: any[]) {
  const changedProps: string[] = [];
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
      if (
        originalKey !== '_id' &&
        !_.isEqual(updatedProperty[originalKey], originalProperty[originalKey])
      ) {
        changedProps.push(originalKey);
      }
    });
  });

  return changedProps;
}
function checkIfFilterConditionsMet(changedProperties: string[]) {
  let shouldReindex = false;
  changedProperties.every(property => {
    if (!SHOULD_NOT_TRIGGER_REINDEX.includes(property)) {
      shouldReindex = true;
    }
    if (shouldReindex) {
      return false;
    }
    return true;
  });
  return shouldReindex;
}

function compareShallowProperties(updatedTemplate: any, originalTemplate: any, updatedKeys: string[]) {
  const changedProperties: string[] = [];
  updatedKeys.forEach(key => {
    if (Array.isArray(updatedTemplate[key])) {
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
  return changedProperties;
}

export async function checkIfReindex(updatedTemplate: any) {
  if (updatedTemplate._id) {
    let changedProperties: string[] = [];
    const [originalTemplate] = await templates.get({ _id: updatedTemplate._id });
    const updatedKeys = Object.keys(updatedTemplate);

    changedProperties = compareShallowProperties(updatedTemplate, originalTemplate, updatedKeys);
    return checkIfFilterConditionsMet(changedProperties);
  }
  return false;
}
