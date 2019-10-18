"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _Map = require("../../../Map");

var actions = _interopRequireWildcard(require("../../../Library/actions/libraryActions"));
var _Map2 = require("../Map.js");
var _markdownDatasets = _interopRequireDefault(require("../../markdownDatasets"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('Map Markdown component', () => {
  const state = {};

  function getProps(originalState, originalProps, dispatch) {
    const _dispatch = dispatch || jest.fn('dispatch');
    return _objectSpread({},
    (0, _Map2.mapStateToProps)(originalState, originalProps), {},
    (0, _Map2.mapDispatchToProps)(_dispatch));

  }

  function spyOnDatasetRows() {
    spyOn(_markdownDatasets.default, 'getRows').and.returnValue(_immutable.default.fromJS([
    { template: 't1', metadata: { geoProperty: { lat: 7, lon: 13 } } },
    { template: 't2', metadata: { anotherGeoProperty: { lat: 2018, lon: 6 } } }]));

  }

  function findInnerMapComponent(component) {
    return component.find(_Map.Markers).props().children([{ value: 'markers' }]);
  }

  it('should render the data passed by mapStateToProps', () => {
    spyOn(_markdownDatasets.default, 'getRows').and.returnValue(_immutable.default.fromJS(['passed entities']));

    const props = getProps(state, { prop1: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Map2.MapComponent, _extends({}, props, { classname: "custom-class" })));
    const map = findInnerMapComponent(component);

    expect(_markdownDatasets.default.getRows).toHaveBeenCalledWith(state, { prop1: 'propValue' });
    expect(component).toMatchSnapshot();
    expect(map).toMatchSnapshot();
  });

  it('should render a placeholder when data is undefined', () => {
    let undefinedValue;
    spyOn(_markdownDatasets.default, 'getRows').and.returnValue(undefinedValue);
    const props = getProps(state, { prop2: 'propValue' });
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Map2.MapComponent, props));

    expect(_markdownDatasets.default.getRows).toHaveBeenCalledWith(state, { prop2: 'propValue' });
    expect(component).toMatchSnapshot();
  });

  describe('renderPopupInfo', () => {
    it('should have a correct function for rendering popus', () => {
      spyOnDatasetRows();

      const props = getProps(state, { prop2: 'propValue' });
      const component = (0, _enzyme.shallow)(_react.default.createElement(_Map2.MapComponent, props));
      const marker1 = { properties: { entity: { template: 't1', title: 'title' } } };
      const marker2 = { properties: { entity: { template: 't2', title: 'another title' } } };

      const popUp1 = findInnerMapComponent(component).props.renderPopupInfo(marker1);
      expect(popUp1).toMatchSnapshot();
      const popUp2 = findInnerMapComponent(component).props.renderPopupInfo(marker2);
      expect(popUp2).toMatchSnapshot();
    });
  });

  describe('clickOnMarker', () => {
    it('should fetch and display document when marker is clicked', () => {
      spyOnDatasetRows();

      const getAndSelectDocument = jest.spyOn(actions, 'getAndSelectDocument');
      const dispatch = jest.fn();
      const props = getProps(state, { prop2: 'propValue' }, dispatch);
      const component = (0, _enzyme.shallow)(_react.default.createElement(_Map2.MapComponent, props));
      const marker = { properties: { entity: { template: 't1', title: 'title', sharedId: 'id' } } };
      findInnerMapComponent(component).props.clickOnMarker(marker);
      expect(getAndSelectDocument).toHaveBeenCalledWith('id');
    });
  });

  describe('clickOnCluster', () => {
    it('should set documents in cluster as selected documents', () => {
      spyOnDatasetRows();

      const unselectAllDocuments = jest.spyOn(actions, 'unselectAllDocuments');
      const selectDocuments = jest.spyOn(actions, 'selectDocuments');
      const dispatch = jest.fn();
      const props = getProps(state, { prop2: 'propValue' }, dispatch);
      const component = (0, _enzyme.shallow)(_react.default.createElement(_Map2.MapComponent, props));
      const cluster = [
      { properties: { entity: { template: 't1', title: 'title', sharedId: 'id' } } },
      { properties: { entity: { template: 't1', title: 'title', sharedId: 'id2' } } }];

      findInnerMapComponent(component).props.clickOnCluster(cluster);
      expect(unselectAllDocuments).toHaveBeenCalled();
      expect(selectDocuments).toHaveBeenCalledWith([
      { template: 't1', title: 'title', sharedId: 'id' },
      { template: 't1', title: 'title', sharedId: 'id2' }]);

    });
  });
});