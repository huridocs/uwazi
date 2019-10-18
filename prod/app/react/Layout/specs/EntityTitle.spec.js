"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _EntityTitle = _interopRequireWildcard(require("../EntityTitle.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('EntityTitle', () => {
  let component;
  let state;
  let props;

  beforeEach(() => {
    props = {
      context: 'template1',
      entity: 'entity1SharedId' };


    state = {
      thesauris: _immutable.default.fromJS([
      { type: 'notTemplate' },
      { type: 'template',
        _id: 'template1',
        values: [
        { id: 'entity1SharedId', label: 'Entity 1' },
        { id: 'entity2SharedId', label: 'Entity 2' }] },


      { type: 'template',
        _id: 'template2',
        values: [
        { id: 'entity3SharedId', label: 'Entity 3' }] }]) };




  });

  const render = () => {
    const compoundProps = Object.assign({}, props, (0, _EntityTitle.mapStateToProps)(state, _objectSpread({}, props)));
    component = (0, _enzyme.shallow)(_react.default.createElement(_EntityTitle.default.WrappedComponent, compoundProps));
  };

  it('should render the entity title as found in thesauris', () => {
    render();
    expect(component).toMatchSnapshot();

    props.entity = 'entity2SharedId';
    render();
    expect(component).toMatchSnapshot();

    props.context = 'template2';
    props.entity = 'entity3SharedId';
    render();
    expect(component).toMatchSnapshot();
  });
});