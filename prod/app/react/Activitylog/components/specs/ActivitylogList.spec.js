"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _ActivitylogList = _interopRequireWildcard(require("../ActivitylogList.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ActivitylogList', () => {
  let props;
  let state;
  let component;

  const render = () => {
    const semantic = { beautified: true, description: 'created', name: 'Name', action: 'CREATE', extra: 'extra info' };
    props = {};
    state = {
      activitylog: {
        list: _immutable.default.fromJS([
        { _id: 1, method: 'POST', url: '/api/entities', body: '{"title":"hey"}', query: '{}', time: '2019-06-17T13:36:12.697Z', semantic },
        { _id: 2, method: 'GET', url: '/api/entities', body: '{}', query: '{"_id": "123"}', time: '2019-06-17T13:36:12.697Z', semantic: {} },
        { _id: 3, method: 'DELETE', url: '/api/entities', body: '{"_id":"123"}', query: '{}', time: '2019-06-17T13:36:12.697Z', semantic: {} }]) } };




    const fullProps = Object.assign({}, props, (0, _ActivitylogList.mapStateToProps)(state));
    component = (0, _enzyme.shallow)(_react.default.createElement(_ActivitylogList.default.WrappedComponent, fullProps));
  };

  it('should render a table with the activity log entries and more button', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should load more entries for the current search', () => {

  });
});