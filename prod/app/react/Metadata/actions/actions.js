"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.resetReduxForm = resetReduxForm;exports.loadInReduxForm = loadInReduxForm;exports.changeTemplate = changeTemplate;exports.loadTemplate = loadTemplate;exports.reuploadDocument = reuploadDocument;exports.removeIcon = removeIcon;exports.multipleUpdate = multipleUpdate;var _reactReduxForm = require("react-redux-form");
var _superagent = _interopRequireDefault(require("superagent"));

var _config = require("../../config.js");
var _advancedSort = require("../../utils/advancedSort");
var _Entities = require("../../Entities");
var _Notifications = require("../../Notifications");
var libraryTypes = _interopRequireWildcard(require("../../Library/actions/actionTypes"));
var _libraryActions = require("../../Library/actions/libraryActions");
var _RequestParams = require("../../utils/RequestParams");
var _defaultTemplate = _interopRequireDefault(require("../helpers/defaultTemplate"));

var types = _interopRequireWildcard(require("./actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function resetReduxForm(form) {
  return _reactReduxForm.actions.reset(form);
}

const propertyExists = (property, previousTemplate) => previousTemplate && Boolean(previousTemplate.properties.find(p => p.name === property.name &&
p.type === property.type &&
p.content === property.content));

const resetMetadata = (metadata, template, options, previousTemplate) => {
  const resetedMetadata = {};
  template.properties.forEach(property => {
    const resetValue = options.resetExisting || !propertyExists(property, previousTemplate) || !metadata[property.name];
    const { type, name } = property;
    if (!resetValue) {
      resetedMetadata[property.name] = metadata[property.name];
    }
    if (resetValue && !['date', 'geolocation', 'link'].includes(type)) {
      resetedMetadata[name] = '';
    }
    if (resetValue && type === 'daterange') {
      resetedMetadata[name] = {};
    }
    if (resetValue && ['multiselect', 'relationship', 'nested', 'multidate', 'multidaterange'].includes(type)) {
      resetedMetadata[name] = [];
    }
  });
  return resetedMetadata;
};

function loadInReduxForm(form, _entity, templates) {
  return dispatch => {
    (_entity.sharedId ? _Entities.api.get(new _RequestParams.RequestParams({ sharedId: _entity.sharedId })) : Promise.resolve([_entity])).
    then(([entity]) => {
      const sortedTemplates = (0, _advancedSort.advancedSort)(templates, { property: 'name' });
      const defaultTemplate = sortedTemplates.find(t => t.default);
      const template = entity.template || defaultTemplate._id;
      const templateconfig = sortedTemplates.find(t => t._id === template) || _defaultTemplate.default;
      const metadata = resetMetadata(entity.metadata || {}, templateconfig, { resetExisting: false }, templateconfig);
      dispatch(_reactReduxForm.actions.reset(form));
      dispatch(_reactReduxForm.actions.load(form, _objectSpread({}, entity, { metadata, template })));
      dispatch(_reactReduxForm.actions.setPristine(form));
    });
  };
}

function changeTemplate(form, templateId) {
  return (dispatch, getState) => {
    const entity = Object.assign({}, (0, _reactReduxForm.getModel)(getState(), form));
    const { templates } = getState();
    const template = templates.find(t => t.get('_id') === templateId);
    const previousTemplate = templates.find(t => t.get('_id') === entity.template);

    entity.metadata = resetMetadata(entity.metadata, template.toJS(), { resetExisting: false }, previousTemplate.toJS());
    entity.template = template.get('_id');

    dispatch(_reactReduxForm.actions.reset(form));
    setTimeout(() => {
      dispatch(_reactReduxForm.actions.load(form, entity));
    });
  };
}

function loadTemplate(form, template) {
  return dispatch => {
    const entity = { template: template._id, metadata: {} };
    entity.metadata = resetMetadata(entity.metadata, template, { resetExisting: true });
    dispatch(_reactReduxForm.actions.load(form, entity));
    dispatch(_reactReduxForm.actions.setPristine(form));
  };
}

function reuploadDocument(docId, file, docSharedId, __reducerKey) {
  return (dispatch, getState) => {
    dispatch({ type: types.START_REUPLOAD_DOCUMENT, doc: docId });
    _superagent.default.post(`${_config.APIURL}reupload`).
    set('Accept', 'application/json').
    set('X-Requested-With', 'XMLHttpRequest').
    set('Content-Language', getState().locale).
    field('document', docSharedId).
    attach('file', file, file.name).
    on('progress', data => {
      dispatch({ type: types.REUPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    }).
    on('response', ({ body }) => {
      const _file = { filename: body.filename, size: body.size, originalname: body.originalname };
      dispatch({ type: types.REUPLOAD_COMPLETE, doc: docId, file: _file, __reducerKey });
      _Entities.api.get(new _RequestParams.RequestParams({ sharedId: docSharedId })).
      then(([doc]) => {
        dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
        dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
        dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      });
    }).
    end();
  };
}

function removeIcon(model) {
  return _reactReduxForm.actions.change(model, { _id: null, type: 'Empty' });
}

function multipleUpdate(entities, values) {
  return dispatch => {
    const updatedEntities = entities.toJS().map(_entity => {
      const entity = _objectSpread({}, _entity);
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      if (values.template) {
        entity.template = values.template;
      }
      return entity;
    });

    const ids = updatedEntities.map(entity => entity.sharedId);
    return _Entities.api.multipleUpdate(new _RequestParams.RequestParams({ ids, values })).
    then(() => {
      dispatch(_Notifications.notificationActions.notify('Update success', 'success'));
      if (values.published !== undefined) {
        dispatch((0, _libraryActions.unselectAllDocuments)());
        dispatch((0, _libraryActions.removeDocuments)(updatedEntities));
      }
      return updatedEntities;
    });
  };
}