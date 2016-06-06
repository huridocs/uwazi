import {actions as formActions} from 'react-redux-form';

import * as types from 'app/Templates/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';

export function resetTemplate() {
  return function (dispatch) {
    dispatch(formActions.reset('template.data'));
  };
}

export function addProperty(property = {}, index = 0) {
  property.localID = ID();
  return function (dispatch, getState) {
    if (property.type === 'select') {
      property.content = getState().template.uiState.toJS().thesauris[0]._id;
    }

    let properties = getState().template.data.properties.slice(0);
    properties.splice(index, 0, property);
    dispatch(formActions.change('template.data.properties', properties));
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
    dispatch(formActions.move('template.data.properties', index, properties.length - 1));
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

      dispatch(formActions.merge('template.data', {_id: response.id, _rev: response.rev}));
      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
