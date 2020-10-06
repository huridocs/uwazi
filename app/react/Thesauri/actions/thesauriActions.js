import superagent from 'superagent';
import { actions as formActions } from 'react-redux-form';
import { t } from 'app/I18N';
import ID from 'shared/uniqueID';
import * as types from 'app/Thesauri/actions/actionTypes';
import { APIURL } from 'app/config';
import api from 'app/Thesauri/ThesauriAPI';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import { advancedSort } from 'app/utils/advancedSort';
import { RequestParams } from 'app/utils/RequestParams';

export function saveThesaurus(thesaurus) {
  return dispatch =>
    api.save(new RequestParams(thesaurus)).then(_thesauri => {
      dispatch({ type: types.THESAURI_SAVED });
      notifications.notify(t('System', 'Thesaurus saved', null, false), 'success')(dispatch);
      dispatch(formActions.change('thesauri.data', _thesauri));
    });
}

export function importThesaurus(thesaurus, file) {
  return dispatch =>
    new Promise(resolve =>
      superagent
        .post(`${APIURL}thesauris`)
        .set('Accept', 'application/json')
        .set('X-Requested-With', 'XMLHttpRequest')
        .field('thesauri', JSON.stringify(thesaurus))
        .attach('file', file, file.name)
        .on('response', response => {
          const data = JSON.parse(response.text);
          if (response.status === 200) {
            dispatch({ type: types.THESAURI_SAVED });
            notifications.notify(t('System', 'Data imported', null, false), 'success')(dispatch);
            dispatch(formActions.change('thesauri.data', data));
          } else {
            notifications.notify(t('System', data.error, null, false), 'danger')(dispatch);
          }
          resolve();
        })
        .end()
    );
}

export function sortValues() {
  return (dispatch, getState) => {
    let values = getState().thesauri.data.values.slice(0);
    values = advancedSort(values, { property: 'label' });
    values = values.map(value => ({
      ...value,
      ...(value.values
        ? { values: advancedSort(value.values.slice(0), { property: 'label' }) }
        : {}),
    }));
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

function areGroupsRemovedFromList(newValues, oldValues) {
  return oldValues.some(item => {
    if (!item.values) {
      return false;
    }
    return !newValues.some(oldItem => oldItem.id === item.id);
  });
}

function listContainsGroups(values) {
  return values.some(value => value.values);
}

export function updateValues(updatedValues, groupIndex) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    const _updatedValues = moveEmptyItemToBottom(updatedValues);
    if (!_updatedValues) {
      return;
    }
    if (groupIndex !== undefined) {
      if (listContainsGroups(_updatedValues)) {
        return;
      }
      values[groupIndex] = { ...values[groupIndex], values: _updatedValues };
      dispatch(formActions.change('thesauri.data.values', values));
      return;
    }
    if (areGroupsRemovedFromList(updatedValues, values)) {
      return;
    }
    dispatch(formActions.change('thesauri.data.values', _updatedValues));
  };
}

export function addValue(group) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (group !== undefined) {
      values[group] = { ...values[group] };
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
    const newGroup = { label: '', id: ID(), values: [{ label: '', id: ID() }] };
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
      values[groupIndex] = { ...values[groupIndex] };
      values[groupIndex].values = values[groupIndex].values.slice(0);
      values[groupIndex].values.splice(index, 1);
    } else {
      values.splice(index, 1);
    }
    dispatch(formActions.change('thesauri.data.values', values));
  };
}
