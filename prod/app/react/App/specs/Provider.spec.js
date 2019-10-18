"use strict";var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _testUtils = _interopRequireDefault(require("react-dom/test-utils"));

var _Provider = _interopRequireDefault(require("../Provider"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('Provider', () => {
  let component;
  const initialData = { data: 'some data' };
  const user = { name: 'Bane' };

  class TestController extends _react.Component {
    constructor(props, context) {
      super(props, context);
      this.state = {};
      this.context = context;
    }

    static requestState() {
      return Promise.resolve({ initialData: 'data' });
    }

    render() {
      return _jsx("div", {});
    }}


  TestController.contextTypes = { getInitialData: _propTypes.default.func, getUser: _propTypes.default.func };

  afterEach(() => {
    delete window.__reduxData__;
    delete window.__user__;
  });

  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      _testUtils.default.renderIntoDocument(
      _jsx(_Provider.default, { initialData: initialData }, void 0,
      _react.default.createElement(TestController, { ref: ref => component = ref })));


      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });

    it('should be provided to RouteHandler with getUser', () => {
      _testUtils.default.renderIntoDocument(
      _jsx(_Provider.default, { initialData: initialData, user: user }, void 0,
      _react.default.createElement(TestController, { ref: ref => component = ref })));


      expect(component.context.getUser).toEqual(jasmine.any(Function));
    });
  });

  describe('getInitialData()', () => {
    describe('when is in props', () => {
      beforeEach(() => {
        _testUtils.default.renderIntoDocument(
        _jsx(_Provider.default, { initialData: initialData }, void 0, _react.default.createElement(TestController, { ref: ref => component = ref })));


      });

      it('should be accessible via getInitialData', () => {
        expect(component.context.getInitialData()).toEqual({ data: 'some data' });
      });
    });

    describe('when is on window', () => {
      beforeEach(() => {
        window.__reduxData__ = { data: 'some data' };
        _testUtils.default.renderIntoDocument(
        _jsx(_Provider.default, {}, void 0, _react.default.createElement(TestController, { ref: ref => component = ref })));

      });

      it('should be accessible via getInitialData ONLY ONCE', () => {
        expect(component.context.getInitialData()).toEqual({ data: 'some data' });
        expect(component.context.getInitialData()).toBeUndefined();
      });
    });

    describe('getUser()', () => {
      describe('when is in props', () => {
        beforeEach(() => {
          _testUtils.default.renderIntoDocument(
          _jsx(_Provider.default, { initialData: initialData, user: user }, void 0,
          _react.default.createElement(TestController, { ref: ref => component = ref })));


        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({ name: 'Bane' });
        });
      });

      describe('when is in window', () => {
        beforeEach(() => {
          window.__user__ = user;
          _testUtils.default.renderIntoDocument(
          _jsx(_Provider.default, { initialData: initialData }, void 0, _react.default.createElement(TestController, { ref: ref => component = ref })));


        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({ name: 'Bane' });
        });
      });
    });
  });
});