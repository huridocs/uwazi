import Immutable from 'immutable';

import * as types from 'app/Templates/actions/actionTypes';
import {notify} from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'app/utils/uniqueID';

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

export function addProperty(config = {}, index = 0) {
  config.localID = ID();
  return {
    type: types.ADD_PROPERTY,
    config,
    index
  };
}

export function updateProperty(config, index) {
  return {
    type: types.UPDATE_PROPERTY,
    config,
    index
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
  return {
    type: types.REORDER_PROPERTY,
    originIndex,
    targetIndex
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
