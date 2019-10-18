"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.resetTemplate = resetTemplate;exports.addProperty = addProperty;exports.setNestedProperties = setNestedProperties;exports.updateProperty = updateProperty;exports.inserted = inserted;exports.selectProperty = selectProperty;exports.removeProperty = removeProperty;exports.reorderProperty = reorderProperty;exports.saveTemplate = saveTemplate;var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../utils/RequestParams");

var types = _interopRequireWildcard(require("./actionTypes"));
var _Notifications = require("../../Notifications");
var _TemplatesAPI = _interopRequireDefault(require("../TemplatesAPI"));
var _uniqueID = _interopRequireDefault(require("../../../shared/uniqueID"));
var _BasicReducer = require("../../BasicReducer");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function resetTemplate() {
  return dispatch => {
    dispatch(_reactReduxForm.actions.reset('template.data'));
    dispatch(_reactReduxForm.actions.setInitial('template.data'));
  };
}

function addProperty(property = {}, _index) {
  property.localID = (0, _uniqueID.default)();
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    const index = _index !== undefined ? _index : properties.length;
    if (property.type === 'select' || property.type === 'multiselect') {
      property.content = getState().thesauris.get(0).get('_id');
    }

    if (property.type === 'relationship') {
      property.inherit = false;
    }

    if (property.type === 'nested') {
      property.nestedProperties = [{ key: '', label: '' }];
    }

    properties.splice(index, 0, property);
    dispatch(_reactReduxForm.actions.change('template.data.properties', properties));
  };
}

function setNestedProperties(propertyIndex, properties) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.load(`template.data.properties[${propertyIndex}].nestedProperties`, properties));
  };
}

function updateProperty(property, index) {
  return (dispatch, getState) => {
    const properties = getState().template.data.properties.slice(0);
    properties.splice(index, 1, property);
    dispatch(_reactReduxForm.actions.change('template.data.properties', properties));
  };
}

function inserted(index) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.change(`template.data.properties[${index}].inserting`, null));
  };
}

function selectProperty(index) {
  return {
    type: types.SELECT_PROPERTY,
    index };

}

function removeProperty(index) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.remove('template.data.properties', index));
    dispatch(_reactReduxForm.actions.resetErrors('template.data'));
  };
}

function reorderProperty(originIndex, targetIndex) {
  return dispatch => {
    dispatch(_reactReduxForm.actions.move('template.data.properties', originIndex, targetIndex));
  };
}

const sanitize = data => {
  data.properties = data.properties.map(_prop => {
    const prop = _objectSpread({}, _prop);
    if (prop.inherit && !prop.content) {
      prop.inherit = false;
    }
    return prop;
  });
  return data;
};

function saveTemplate(data) {
  const template = sanitize(data);
  return dispatch => {
    dispatch({ type: types.SAVING_TEMPLATE });
    return _TemplatesAPI.default.save(new _RequestParams.RequestParams(template)).
    then(response => {
      dispatch({ type: types.TEMPLATE_SAVED, data: response });
      dispatch(_BasicReducer.actions.update('templates', response));

      dispatch(_reactReduxForm.actions.merge('template.data', response));
      dispatch(_Notifications.notificationActions.notify('Saved successfully.', 'success'));
    }).
    catch(() => {
      dispatch({ type: types.TEMPLATE_SAVED, data });
    });
  };
}