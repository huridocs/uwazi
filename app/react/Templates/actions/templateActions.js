import {actions as formActions} from 'react-redux-form';

import * as types from 'app/Templates/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';
import {actions} from 'app/BasicReducer';

export function resetTemplate() {
  return function (dispatch) {
    dispatch(formActions.reset('template.data'));
    dispatch(formActions.setInitial('template.data'));
  };
}

export function addProperty(property = {}, index = 0) {
  property.localID = ID();
  return function (dispatch, getState) {
    if (property.type === 'select' || property.type === 'multiselect') {
      property.content = getState().thesauris.get(0).get('_id');
    }

    if (property.type === 'nested') {
      property.nestedProperties = [{key: '', label: ''}];
    }

    let properties = getState().template.data.properties.slice(0);
    properties.splice(index, 0, property);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function setNestedProperties(propertyIndex, properties) {
  return function (dispatch) {
    dispatch(formActions.load(`template.data.properties[${propertyIndex}].nestedProperties`, properties));
  };
}

export function updateProperty(property, index) {
  return function (dispatch, getState) {
    let properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1, property);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function inserted(index) {
  return function (dispatch) {
    dispatch(formActions.change(`template.data.properties[${index}].inserting`, null));
  };
}

export function selectProperty(index) {
  return {
    type: types.SELECT_PROPERTY,
    index
  };
}

export function removeProperty(index) {
  return function (dispatch, getState) {
    let properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return function (dispatch) {
    dispatch(formActions.move('template.data.properties', originIndex, targetIndex));
  };
}

export function saveTemplate(data) {
  return function (dispatch) {
    dispatch({type: types.SAVING_TEMPLATE});
    return api.save(data)
    .then((response) => {
      dispatch({type: types.TEMPLATE_SAVED, data: response});
      dispatch(actions.update('templates', response));

      dispatch(formActions.merge('template.data', response));
      dispatch(notify('Saved successfully.', 'success'));
    });
  };
}

export function saveEntity(data) {
  let entity = Object.assign({}, data, {isEntity: true});
  return function (dispatch) {
    saveTemplate(entity)(dispatch);
  };
}
