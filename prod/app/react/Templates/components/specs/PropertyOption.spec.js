"use strict";var _react = _interopRequireDefault(require("react"));
var _testUtils = _interopRequireDefault(require("react-dom/test-utils"));
var _reactDndTestBackend = _interopRequireDefault(require("react-dnd-test-backend"));
var _reactDnd = require("react-dnd");
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _PropertyOption = _interopRequireWildcard(require("../PropertyOption"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

function wrapInTestContext(DecoratedComponent) {
  return (0, _reactDnd.DragDropContext)(_reactDndTestBackend.default)(DecoratedComponent);
}

describe('PropertyOption', () => {
  let backend;
  let monitor;
  let store;
  let TestComponent;
  let component;
  let item;

  function renderComponent(ComponentToRender, props) {
    let result;
    store = (0, _redux.createStore)(() => ({}));
    _testUtils.default.renderIntoDocument(_jsx(_reactRedux.Provider, { store: store }, void 0, _react.default.createElement(ComponentToRender, _extends({ ref: ref => result = ref }, props))));
    return result;
  }

  describe('PropertyOption', () => {
    it('should have mapped removeProperty action into props', () => {
      TestComponent = wrapInTestContext(_PropertyOption.default);
      component = renderComponent(TestComponent, { label: 'test', type: 'optionType', addProperty: () => {} });
      const option = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.default).getWrappedInstance();
      expect(option.props.removeProperty).toEqual(jasmine.any(Function));
    });
  });

  describe('DragSource', () => {
    beforeEach(() => {
      item = { label: 'test', type: 'optionType', addProperty: () => {} };
      TestComponent = wrapInTestContext(_PropertyOption.dragSource);
      component = renderComponent(TestComponent, item);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('beginDrag', () => {
      it('should return an object with name', () => {
        const option = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.dragSource);
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(monitor.getItem()).toEqual(item);
      });
    });

    describe('endDrag', () => {
      describe('when item has no index', () => {
        it('should not call REMOVE_FIELD', () => {
          const props = { label: 'test', removeProperty: jasmine.createSpy(), type: 'optionType', addProperty: () => {} };
          component = renderComponent(TestComponent, props);
          backend = component.getManager().getBackend();
          monitor = component.getManager().getMonitor();

          const option = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.dragSource);
          backend.simulateBeginDrag([option.getHandlerId()]);
          monitor.getItem().index = null;
          backend.simulateDrop();
          backend.simulateEndDrag([option.getHandlerId()]);

          expect(props.removeProperty).not.toHaveBeenCalled();
        });
      });
      describe('when not droped on a target and item has an index', () => {
        it('should call REMOVE_FIELD with the index', () => {
          const props = { label: 'test', removeProperty: jasmine.createSpy(), type: 'optionType', addProperty: () => {} };
          component = renderComponent(TestComponent, props);
          backend = component.getManager().getBackend();
          monitor = component.getManager().getMonitor();

          const option = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.dragSource);
          backend.simulateBeginDrag([option.getHandlerId()]);
          monitor.getItem().index = 1;
          backend.simulateDrop();
          backend.simulateEndDrag([option.getHandlerId()]);

          expect(props.removeProperty).toHaveBeenCalledWith(1);
        });
      });
    });
  });
});