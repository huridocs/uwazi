import * as types from 'app/Templates/actions/actionTypes';

export function editProperty(id) {
  return {
    type: types.EDIT_PROPERTY,
    id
  };
}

export function setThesauri(thesauri) {
  return {
    type: types.SET_THESAURI,
    thesauri
  };
}

export function showRemovePropertyConfirm(propertyId) {
  return {
    type: types.SHOW_REMOVE_PROPERTY_CONFIRM,
    propertyId
  };
}

export function hideRemovePropertyConfirm() {
  return {
    type: types.HIDE_REMOVE_PROPERTY_CONFIRM
  };
}
