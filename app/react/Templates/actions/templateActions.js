import { actions as formActions } from 'react-redux-form';

import * as types from 'app/Templates/actions/actionTypes';
import { notify } from 'app/Notifications';
import api from 'app/Templates/TemplatesAPI';
import ID from 'shared/uniqueID';
import { actions } from 'app/BasicReducer';

export function resetTemplate() {
  return (dispatch) => {
    dispatch(formActions.reset('template.data'));
    dispatch(formActions.setInitial('template.data'));
  };
}

export function addProperty(property = {}, _index) {
  property.localID = ID();
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    const index = _index || properties.length;
    if (property.type === 'select' || property.type === 'multiselect') {
      property.content = getState().thesauris.get(0).get('_id');
    }

    if (property.type === 'nested') {
      property.nestedProperties = [{ key: '', label: '' }];
    }

    properties.splice(index, 0, property);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function setNestedProperties(propertyIndex, properties) {
  return (dispatch) => {
    dispatch(formActions.load(`template.data.properties[${propertyIndex}].nestedProperties`, properties));
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
  return (dispatch) => {
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
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1);
    dispatch(formActions.change('template.data.properties', properties));
  };
}

export function reorderProperty(originIndex, targetIndex) {
  return (dispatch) => {
    dispatch(formActions.move('template.data.properties', originIndex, targetIndex));
  };
}

export function saveTemplate(data) {
  return (dispatch) => {
    dispatch({ type: types.SAVING_TEMPLATE });
    return api.save(data)
    .then((response) => {
      dispatch({ type: types.TEMPLATE_SAVED, data: response });
      dispatch(actions.update('templates', response));

      dispatch(formActions.merge('template.data', response));
      dispatch(notify('Saved successfully.', 'success'));
    })
    .catch(() => {
      dispatch({ type: types.TEMPLATE_SAVED, data });
    });
  };
}

export function saveEntity(data) {
  const entity = Object.assign({}, data, { isEntity: true });
  return (dispatch) => {
    saveTemplate(entity)(dispatch);
  };
}
