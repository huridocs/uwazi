import * as types from './actionTypes';

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

export function setTemplates(templates) {
  return {
    type: types.SET_TEMPLATES,
    templates
  };
}
