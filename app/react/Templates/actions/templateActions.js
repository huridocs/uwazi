import {actions as formActions} from 'react-redux-form';

import * as types from 'app/Templates/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';

export function resetTemplate() {
  return function (dispatch) {
    dispatch(formActions.reset('template.model'));
  };
}

export function addProperty(property = {}, index = 0) {
  property.localID = ID();
  return function (dispatch, getState) {
    let properties = getState().template.model.properties.slice(0);
    properties.splice(index, 0, property);
    dispatch(formActions.change('template.model.properties', properties));
  };
}

export function updateProperty(property, index) {
  return function (dispatch, getState) {
    let properties = getState().template.model.properties.slice(0);
    properties.splice(index, 1, property);
    dispatch(formActions.change('template.model.properties', properties));
  };
}

export function inserted(index) {
  return function (dispatch) {
    dispatch(formActions.change(`template.model.properties[${index}].inserting`, null));
  };
}

export function selectProperty(index) {
  return {
    type: types.SELECT_PROPERTY,
    index
  };
}

export function removeProperty(index) {
  return function (dispatch) {
    dispatch(formActions.remove('template.model.properties', index));
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return function (dispatch) {
    dispatch(formActions.move('template.model.properties', originIndex, targetIndex));
  };
}

export function saveTemplate(data) {
  return function (dispatch) {
    return api.save(data)
    .then((response) => {
      dispatch({
        type: types.TEMPLATE_SAVED,
        data: response
      });

      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
