"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.groupByHubs = groupByHubs;exports.RelationshipCollection = void 0;var _errorLog = _interopRequireDefault(require("../log/errorLog"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

function groupByHubs(references) {
  const hubs = references.reduce((_hubs, reference) => {
    if (!_hubs[reference.hub]) {
      _hubs[reference.hub] = []; //eslint-disable-line no-param-reassign
    }
    _hubs[reference.hub].push(reference);
    return _hubs;
  }, []);
  return Object.keys(hubs).map(key => hubs[key]);
}

class RelationshipCollection extends Array {
  removeOtherLanguageTextReferences(connectedDocuments) {
    return this.filter(r => {
      if (r.filename) {
        const filename = connectedDocuments[r.entity].file ? connectedDocuments[r.entity].file.filename : '';
        return r.filename === filename;
      }
      return true;
    });
  }

  removeOrphanHubsOf(sharedId) {
    const hubs = groupByHubs(this).filter(h => h.map(r => r.entity).includes(sharedId));
    return new RelationshipCollection(...Array.prototype.concat(...hubs));
  }

  removeSingleHubs() {
    const hubRelationshipsCount = this.reduce((data, r) => {
      data[r.hub.toString()] = data[r.hub.toString()] ? data[r.hub.toString()] + 1 : 1; //eslint-disable-line no-param-reassign
      return data;
    }, {});

    return this.filter(r => hubRelationshipsCount[r.hub.toString()] > 1);
  }

  withConnectedData(connectedDocuments) {
    return this.map(relationship => _objectSpread({
      template: null,
      entityData: connectedDocuments[relationship.entity] },
    relationship)).
    filter(relationship => {
      if (!relationship.entityData) {
        _errorLog.default.error(`There's a connection to entity: ${relationship.entity} on hub: ${relationship.hub}, but no entity data.`);
        return false;
      }
      return true;
    });
  }

  removeUnpublished() {
    return this.filter(relationship => relationship.entityData.published);
  }}exports.RelationshipCollection = RelationshipCollection;