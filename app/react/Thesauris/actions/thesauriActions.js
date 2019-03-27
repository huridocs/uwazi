import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import ID from 'shared/uniqueID';
import * as types from 'app/Thesauris/actions/actionTypes';
import api from 'app/Thesauris/ThesaurisAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import { advancedSort } from 'app/utils/advancedSort';


export function saveThesauri(thesauri) {
  return dispatch => api.save(thesauri).then((_thesauri) => {
    dispatch({ type: types.THESAURI_SAVED });
    notifications.notify(t('System', 'Thesaurus saved', null, false), 'success')(dispatch);
    dispatch(formActions.change('thesauri.data', _thesauri));
  });
}

export function sortValues() {
  return (dispatch, getState) => {
    let values = getState().thesauri.data.values.slice(0);
    values = advancedSort(values, { property: 'label' });
    values = values.map((_value) => {
      const value = Object.assign({}, _value);
      if (value.values) {
        value.values = value.values.slice(0);
        value.values = advancedSort(value.values, { property: 'label' });
      }
      return value;
    });
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function moveValues(valuesToMove, groupIndex) {
  return (dispatch, getState) => {
    let values = getState().thesauri.data.values.slice(0);

    values = values.map((_value, index) => {
      const value = Object.assign({}, _value);
      if (value.values) {
        value.values = value.values.slice(0).filter(v => !valuesToMove.find(_v => v.id === _v.id));
      }
      if (groupIndex === index) {
        value.values.splice(-1, 1);
        value.values = value.values.concat(valuesToMove);
      }
      return value;
    }).filter(v => !valuesToMove.find(_v => v.id === _v.id));

    if (typeof groupIndex !== 'number') {
      values.splice(-1, 1);
      values = values.concat(valuesToMove);
    }
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

function moveEmptyItemToBottom(values) {
  const _values = [...values];
  const emptyIdx = _values.reduce((found, value, index) => {
    if (!value.label && index < _values.length) {
      return found.concat([index]);
    }
    return found;
  }, []);
  if (emptyIdx.length > 1) {
    return null;
  }
  if (emptyIdx.length === 1) {
    const index = emptyIdx[0];
    const emptyValue = _values[index];
    _values.splice(index, 1);
    _values.push(emptyValue);
  }
  return _values;
}

export function updateValues(updatedValues, groupIndex) {
  return (dispatch, getState) => {
    const _updatedValues = moveEmptyItemToBottom(updatedValues);
    if (!_updatedValues) {
      return;
    }
    if (groupIndex !== undefined) {
      const values = getState().thesauri.data.values.slice(0);
      values[groupIndex] = { ...values[groupIndex], values: _updatedValues };
      dispatch(formActions.change('thesauri.data.values', values));
      return;
    }
    dispatch(formActions.change('thesauri.data.values', _updatedValues));
  };
}

export function updateGroupValues(groupIndex, updatedValues) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    values[groupIndex] = { ...values[groupIndex], values: updatedValues };
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function moveValueToIndex(sourceIndex, sourceGroupIndex, targetIndex, targetGroupIndex) {
  return (dispatch, getState) => {
    const origValues = getState().thesauri.data.values.slice(0);
    const values = origValues.map((v) => {
      const value = { ...v };
      if (value.values) {
        value.values = value.values.slice(0);
      }
      return value;
    });

    const sourceGroup = typeof sourceGroupIndex !== 'number' ? values : values[sourceGroupIndex].values;
    const targetGroup = typeof targetGroupIndex !== 'number' ? values : values[targetGroupIndex].values;

    const value = sourceGroup[sourceIndex];

    targetGroup.splice(targetIndex, 0, value);
    const indexToDelete = (sourceGroupIndex === targetGroupIndex && targetIndex <= sourceIndex) ? sourceIndex + 1 : sourceIndex;
    sourceGroup.splice(indexToDelete, 1);
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function addValue(group) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (group !== undefined) {
      values[group] = Object.assign({}, values[group]);
      values[group].values = values[group].values.slice(0);
      values[group].values.push({ label: '', id: ID() });
    } else {
      values.push({ label: '', id: ID() });
    }

    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function addGroup() {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    const lastIndex = values.length - 1;
    const newGroup = { label: '', values: [{ label: '', id: ID() }] };
    if (!values[lastIndex].values) {
      values[lastIndex] = newGroup;
    } else {
      values.push(newGroup);
    }
    dispatch(formActions.change('thesauri.data.values', values));
  };
}

export function removeValue(index, groupIndex) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (typeof groupIndex === 'number') {
      values[groupIndex] = Object.assign({}, values[groupIndex]);
      values[groupIndex].values = values[groupIndex].values.slice(0);
      values[groupIndex].values.splice(index, 1);
    } else {
      values.splice(index, 1);
    }
    dispatch(formActions.change('thesauri.data.values', values));
  };
}
