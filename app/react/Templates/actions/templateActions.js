import Immutable from 'immutable';
import {actions as formActions} from 'react-redux-form';

import * as types from 'app/Templates/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';

export function resetTemplate() {
  return {
    type: types.RESET_TEMPLATE
  };
}

export function setTemplate(template) {
  return {
    type: types.SET_TEMPLATE,
    template
  };
}

export function updateTemplate(template) {
  return {
    type: types.UPDATE_TEMPLATE,
    template
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
  return {
    type: types.REMOVE_PROPERTY,
    index
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return function (dispatch) {
    dispatch(formActions.move('template.model.properties', originIndex, targetIndex));
  };
}

export function saveTemplate(data) {
  let templateData = Immutable.fromJS(data).updateIn(['properties'], (properties) => {
    return properties.map((property) => property.delete('idToRender'));
  }).toJS();

  return function (dispatch) {
    return api.save(templateData)
    .then((response) => {
      dispatch({
        type: types.TEMPLATE_SAVED,
        data: response
      });

      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
