"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.saveThesauri = saveThesauri;exports.importThesauri = importThesauri;exports.sortValues = sortValues;exports.updateValues = updateValues;exports.addValue = addValue;exports.addGroup = addGroup;exports.removeValue = removeValue;var _superagent = _interopRequireDefault(require("superagent"));
var _reactReduxForm = require("react-redux-form");
var _I18N = require("../../I18N");
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));
var types = _interopRequireWildcard(require("./actionTypes"));
var _config = require("../../config");
var _ThesaurisAPI = _interopRequireDefault(require("../ThesaurisAPI"));
var notifications = _interopRequireWildcard(require("../../Notifications/actions/notificationsActions"));
var _advancedSort = require("../../utils/advancedSort");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}


function saveThesauri(thesauri) {
  return dispatch => _ThesaurisAPI.default.save(new _RequestParams.RequestParams(thesauri)).then(_thesauri => {
    dispatch({ type: types.THESAURI_SAVED });
    notifications.notify((0, _I18N.t)('System', 'Thesaurus saved', null, false), 'success')(dispatch);
    dispatch(_reactReduxForm.actions.change('thesauri.data', _thesauri));
  });
}

function importThesauri(thesauri, file) {
  return dispatch => new Promise((resolve) =>
  _superagent.default.post(`${_config.APIURL}thesauris`).
  set('Accept', 'application/json').
  set('X-Requested-With', 'XMLHttpRequest').
  field('thesauri', JSON.stringify(thesauri)).
  attach('file', file, file.name).
  on('response', response => {
    const data = JSON.parse(response.text);
    if (response.status === 200) {
      dispatch({ type: types.THESAURI_SAVED });
      notifications.notify((0, _I18N.t)('System', 'Data imported', null, false), 'success')(dispatch);
      dispatch(_reactReduxForm.actions.change('thesauri.data', data));
    } else {
      notifications.notify((0, _I18N.t)('System', data.error, null, false), 'danger')(dispatch);
    }
    resolve();
  }).
  end());

}

function sortValues() {
  return (dispatch, getState) => {
    let values = getState().thesauri.data.values.slice(0);
    values = (0, _advancedSort.advancedSort)(values, { property: 'label' });
    values = values.map(_value => {
      const value = Object.assign({}, _value);
      if (value.values) {
        value.values = value.values.slice(0);
        value.values = (0, _advancedSort.advancedSort)(value.values, { property: 'label' });
      }
      return value;
    });
    dispatch(_reactReduxForm.actions.change('thesauri.data.values', values));
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

function updateValues(updatedValues, groupIndex) {
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
      values[groupIndex] = _objectSpread({}, values[groupIndex], { values: _updatedValues });
      dispatch(_reactReduxForm.actions.change('thesauri.data.values', values));
      return;
    }
    if (areGroupsRemovedFromList(updatedValues, values)) {
      return;
    }
    dispatch(_reactReduxForm.actions.change('thesauri.data.values', _updatedValues));
  };
}

function addValue(group) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (group !== undefined) {
      values[group] = Object.assign({}, values[group]);
      values[group].values = values[group].values.slice(0);
      values[group].values.push({ label: '', id: (0, _uniqueID.default)() });
    } else {
      values.push({ label: '', id: (0, _uniqueID.default)() });
    }

    dispatch(_reactReduxForm.actions.change('thesauri.data.values', values));
  };
}

function addGroup() {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    const lastIndex = values.length - 1;
    const newGroup = { label: '', id: (0, _uniqueID.default)(), values: [{ label: '', id: (0, _uniqueID.default)() }] };
    if (!values[lastIndex].values) {
      values[lastIndex] = newGroup;
    } else {
      values.push(newGroup);
    }
    dispatch(_reactReduxForm.actions.change('thesauri.data.values', values));
  };
}

function removeValue(index, groupIndex) {
  return (dispatch, getState) => {
    const values = getState().thesauri.data.values.slice(0);
    if (typeof groupIndex === 'number') {
      values[groupIndex] = Object.assign({}, values[groupIndex]);
      values[groupIndex].values = values[groupIndex].values.slice(0);
      values[groupIndex].values.splice(index, 1);
    } else {
      values.splice(index, 1);
    }
    dispatch(_reactReduxForm.actions.change('thesauri.data.values', values));
  };
}