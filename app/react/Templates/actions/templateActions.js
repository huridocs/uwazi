import * as types from '~/Templates/actions/actionTypes';
import Immutable from 'immutable';
import api from '~/Templates/TemplatesAPI';

export function setTemplate(template) {
  return {
    type: types.SET_TEMPLATE,
    template
  };
}

export function addProperty(config = {}, index = 0) {
  config.id = Math.random().toString(36).substr(2);
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
    return properties.map((property) => property.delete('id'));
  }).toJS();

  return function (dispatch) {
    return api.save(templateData).then((response) => {
      dispatch({
        type: types.TEMPLATE_SAVED,
        data: response
      });
    });
  };
}
