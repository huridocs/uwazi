"use strict";
var _react = _interopRequireDefault(require("react"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
require("jasmine-immutablejs-matchers");
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _moment = _interopRequireDefault(require("moment"));

var _api = _interopRequireDefault(require("../../utils/api"));
var _RequestParams = require("../../utils/RequestParams");
var _I18N = require("../../I18N");

var _RouteHandler = _interopRequireDefault(require("../RouteHandler"));
var _config = require("../../config.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class TestController extends _RouteHandler.default {
  static requestState() {
    return Promise.resolve([
    { type: 'action1', value: 'value1' },
    { type: 'action2', value: 'value2' }]);

  }

  render() {
    return _jsx("div", {});
  }}


describe('RouteHandler', () => {
  let component;
  let instance;
  const routeParams = { id: '123' };
  const headers = {};
  const location = { pathname: '', query: { key: 'value' } };
  const languages = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Español' }];

  let state;

  const context = { store: { getState: () => state, dispatch: jasmine.createSpy('dispatch') } };

  beforeEach(() => {
    spyOn(_api.default, 'locale');
    spyOn(_I18N.I18NUtils, 'saveLocale');

    state = {
      settings: { collection: _immutable.default.fromJS({ languages }) },
      user: _immutable.default.fromJS({}),
      templates: 'templates',
      thesauris: 'thesauris',
      locale: 'de' };


    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}templates`, { body: JSON.stringify({ rows: [] }) });
    delete window.__initialData__;

    spyOn(TestController, 'requestState').and.callThrough();

    _RouteHandler.default.renderedFromServer = false;
    component = (0, _enzyme.shallow)(_jsx(TestController, { params: routeParams, location: location, routes: [{ path: '' }] }), { context });
    instance = component.instance();
    instance.constructor = TestController;
  });

  afterEach(() => _fetchMock.default.restore());

  describe('static requestState', () => {
    it('should return a promise with an empty array', done => {
      _RouteHandler.default.requestState().
      then(response => {
        expect(response).toEqual([]);
        done();
      }).
      catch(done.fail);
    });
  });

  describe('on instance', () => {
    it('should request for initialState and dispatch actions returned', () => {
      expect(TestController.requestState).toHaveBeenCalledWith(new _RequestParams.RequestParams(_objectSpread({}, location.query, {}, routeParams), headers), state);
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'action1', value: 'value1' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'action2', value: 'value2' });
    });

    it('should set the locales of the different stores and services', () => {
      expect(_moment.default.locale()).toBe('de');
      expect(_api.default.locale).toHaveBeenCalledWith('de');
      expect(_I18N.I18NUtils.saveLocale).toHaveBeenCalledWith('de');
    });
  });

  describe('componentWillReceiveProps', () => {
    let props;
    beforeEach(() => {
      props = { params: { id: '456' }, location: { pathname: '/es', query: '' }, routes: [{ path: '' }] };
    });

    describe('when params change', () => {
      it('should request the clientState', () => {
        spyOn(instance, 'getClientState');
        instance.componentWillReceiveProps(props);
        expect(instance.getClientState).toHaveBeenCalledWith(props);
      });

      it('should call emptyState', () => {
        spyOn(instance, 'emptyState');
        instance.componentWillReceiveProps(props);
        expect(instance.emptyState).toHaveBeenCalled();
      });
    });

    describe('when path changes', () => {
      it('should request the clientState', () => {
        spyOn(instance, 'getClientState');
        props = { params: _objectSpread({}, routeParams), location, routes: [{ path: '' }, { path: 'subpath' }] };
        instance.componentWillReceiveProps(props);
        expect(instance.getClientState).toHaveBeenCalledWith(props);
      });
    });

    describe('when params are the same', () => {
      it('should NOT request the clientState', () => {
        spyOn(instance, 'getClientState');
        instance.componentWillReceiveProps({ params: _objectSpread({}, routeParams), location });
        expect(instance.getClientState).not.toHaveBeenCalled();
      });
    });
  });
});