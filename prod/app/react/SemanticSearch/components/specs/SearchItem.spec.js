"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _SearchItem = require("../SearchItem");
var actions = _interopRequireWildcard(require("../../actions/actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('SearchItem', () => {
  let search;
  let dispatch;
  let context;
  beforeEach(() => {
    search = {
      _id: 'id',
      searchTerm: 'query',
      documents: [],
      status: 'completed' };

    dispatch = jest.fn();
    context = { confirm: jasmine.createSpy('confirm') };
  });

  const getProps = () => _objectSpread({
    search },
  (0, _SearchItem.mapDispatchToProps)(dispatch));


  const render = () => (0, _enzyme.shallow)(_react.default.createElement(_SearchItem.SearchItem, getProps()), { context });

  it('should render search details with link to results page ', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should delete search if delete button is clicked', () => {
    jest.spyOn(actions, 'deleteSearch').mockImplementation(() => {});
    const component = render();
    component.find('.delete-search').simulate('click', { preventDefault: () => {} });
    const confirmFunction = context.confirm.calls.mostRecent().args[0].accept;
    confirmFunction();
    expect(actions.deleteSearch).toHaveBeenCalledWith(search._id);
  });

  describe('when search status is inProgress', () => {
    it('should render in-progress icon, progress bar and stop button', () => {
      search.status = 'inProgress';
      const component = render();
      expect(component).toMatchSnapshot();
    });
    it('it should stop search when stop button is clicked', () => {
      jest.spyOn(actions, 'stopSearch').mockImplementation(() => {});
      search.status = 'inProgress';
      const component = render();
      component.find('.stop-search').simulate('click');
      expect(actions.stopSearch).toHaveBeenCalledWith(search._id);
    });
  });

  describe('when search status is stopped', () => {
    it('should render progress bar and resume button', () => {
      search.status = 'stopped';
      const component = render();
      expect(component).toMatchSnapshot();
    });
    it('it should resume search when resume button is clicked', () => {
      jest.spyOn(actions, 'resumeSearch').mockImplementation(() => {});
      search.status = 'stopped';
      const component = render();
      component.find('.resume-search').simulate('click');
      expect(actions.resumeSearch).toHaveBeenCalledWith(search._id);
    });
  });
});