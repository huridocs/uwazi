"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _Markers = require("../Markers.js");
var helper = _interopRequireWildcard(require("../helper"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

describe('Markers component', () => {
  const state = { templates: _immutable.default.fromJS(['templates']) };
  const entities = _immutable.default.fromJS(['entities']);

  let props;

  beforeEach(() => {
    spyOn(helper, 'getMarkers').and.callFake((_entities, templates) => _entities.toJS().concat(templates.toJS()));
    props = (0, _Markers.mapStateToProps)(state);
  });

  it('should return processed markers from entities and templates', () => {
    const resultMarkers = [];

    (0, _enzyme.shallow)(
    _react.default.createElement(_Markers.MarkersComponent, _extends({}, props, { entities: entities }),
    markers => markers.map(m => resultMarkers.push(m))));



    expect(resultMarkers).toMatchSnapshot();
  });
});