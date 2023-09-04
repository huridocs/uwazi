import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import * as types from 'app/Templates/actions/actionTypes';
import { notificationActions } from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';
import { actions } from 'app/BasicReducer';
import entitiesApi from 'app/Entities/EntitiesAPI';
import { t, I18NApi } from 'app/I18N';
import templateCommonProperties from '../utils/templateCommonProperties';

export const prepareTemplate = template => {
  const commonPropertiesExists = template.commonProperties && template.commonProperties.length;

  const commonProperties = commonPropertiesExists
    ? template.commonProperties
    : templateCommonProperties.get();

  return {
    ...template,
    commonProperties: commonProperties.map(p => ({ ...p, localID: ID() })),
    properties: template.properties.map(p => ({ ...p, localID: ID() })),
  };
};

export function resetTemplate() {
  return dispatch => {
    dispatch(formActions.reset('template.data'));
    dispatch(formActions.setInitial('template.data'));
  };
}

export function setPropertyDefaults(getState, property) {
  const propertyWithDefaults = property;
  propertyWithDefaults.localID = ID();
  if (property.type === 'select' || property.type === 'multiselect') {
    propertyWithDefaults.content = getState().thesauris.get(0).get('_id');
  }

  if (property.type === 'relationship') {
    propertyWithDefaults.inherit = false;
    propertyWithDefaults.content = '';
  }

  if (property.type === 'nested') {
    propertyWithDefaults.nestedProperties = [{ key: '', label: '' }];
  }
  return propertyWithDefaults;
}

export function addProperty(property = {}, _index = undefined) {
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    const index = _index !== undefined ? _index : properties.length;
    const propertyWithDefaults = setPropertyDefaults(getState, property);
    properties.splice(index, 0, propertyWithDefaults);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function setNestedProperties(propertyIndex, properties) {
  return dispatch => {
    dispatch(
      formActions.load(`template.data.properties[${propertyIndex}].nestedProperties`, properties)
    );
  };
}

export function updateProperty(property, index) {
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1, property);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function inserted(index) {
  return dispatch => {
    dispatch(formActions.change(`template.data.properties[${index}].inserting`, null));
  };
}

export function selectProperty(index) {
  return {
    type: types.SELECT_PROPERTY,
    index,
  };
}

export function removeProperty(index) {
  return dispatch => {
    dispatch(formActions.remove('template.data.properties', index));
    dispatch(formActions.resetErrors('template.data'));
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return dispatch => {
    dispatch(formActions.move('template.data.properties', originIndex, targetIndex));
  };
}

export const sanitize = data => {
  const commonProperties = data.commonProperties.map(prop => {
    const { localID, ...sanitizedProp } = prop;
    return sanitizedProp;
  });
  const properties = data.properties.map(prop => {
    const { localID, inserting, ...sanitizedProp } = prop;
    if (sanitizedProp.inherit && !sanitizedProp.content) {
      sanitizedProp.inherit = false;
    }
    return sanitizedProp;
  });
  return { ...data, properties, commonProperties };
};

export function validateMapping(template) {
  return api.validateMapping(new RequestParams(template));
}

export function saveTemplate(data) {
  let template = sanitize(data);
  return async dispatch => {
    dispatch({ type: types.SAVING_TEMPLATE });
    try {
      const response = await api.save(new RequestParams(template));
      template = prepareTemplate(response);
      dispatch({ type: types.TEMPLATE_SAVED, data: template });
      dispatch(actions.update('templates', template));
      dispatch(formActions.merge('template.data', template));
      dispatch(
        notificationActions.notify(t('System', 'Saved successfully.', null, false), 'success')
      );
    } catch (e) {
      dispatch({ type: types.TEMPLATE_SAVED, data });
      throw e;
    } finally {
      // Re-load translations
      const translations = await I18NApi.get();
      dispatch(actions.set('translations', translations));
    }
  };
}

export function updateValue(model, value) {
  return dispatch => {
    dispatch(formActions.change(`template.data${model}`, value));
  };
}

export function countByTemplate(template) {
  return entitiesApi.countByTemplate(new RequestParams({ templateId: template._id }));
}
