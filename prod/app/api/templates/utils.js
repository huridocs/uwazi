"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.generateNames = generateNames;exports.generateIds = generateIds;exports.generateNamesAndIds = generateNamesAndIds;exports.getUpdatedNames = getUpdatedNames;exports.getDeletedProperties = getDeletedProperties;exports.generateName = exports.safeName = void 0;var _nodeUuid = _interopRequireDefault(require("node-uuid"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const safeName = label => label.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();exports.safeName = safeName;

const generateName = property => {
  const name = property.label ? safeName(property.label) : property.name;
  return property.type === 'geolocation' ? `${name}_geolocation` : name;
};exports.generateName = generateName;

function generateNames(properties) {
  return properties.map(property => _objectSpread({},
  property, {
    name: generateName(property) }));

}

function generateIds(properties = []) {
  return properties.map(property => _objectSpread({},
  property, {
    id: property.id || _nodeUuid.default.v4() }));

}

function generateNamesAndIds(_properties = []) {
  const properties = generateNames(_properties);
  return generateIds(properties);
}

const flattenProperties = properties => properties.reduce((flatProps, p) => {
  if (p.values) {
    return flatProps.concat(p.values);
  }
  return flatProps.concat(p);
}, []);

function getUpdatedNames(oldProperties = [], newProperties, prop = 'name') {
  const propertiesWithNewName = {};

  flattenProperties(oldProperties).forEach(property => {
    const newProperty = flattenProperties(newProperties).
    find(p => p.id === property.id);

    if (newProperty && newProperty[prop] !== property[prop]) {
      propertiesWithNewName[property[prop]] = newProperty[prop];
    }
  });

  return propertiesWithNewName;
}

const includedIn = propertyCollection => property => !propertyCollection.find(p => p.id === property.id);

function getDeletedProperties(oldProperties = [], newProperties, prop = 'name') {
  return flattenProperties(oldProperties).
  filter(includedIn(flattenProperties(newProperties))).
  map(property => property[prop]);
}