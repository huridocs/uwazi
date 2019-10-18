"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _DescriptionWrapper = _interopRequireDefault(require("../DescriptionWrapper"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('DescriptionWrapper', () => {
  let props;
  let component;
  let children;
  let toggleExpand;

  beforeEach(() => {
    toggleExpand = jasmine.createSpy('toggleExpand');
    props = {
      entry: _immutable.default.fromJS({
        semantic: { beautified: false },
        url: '/api/route/called',
        method: 'POST, PUT or DELETE',
        query: 'Long text for query',
        body: 'Very complex body text' }),

      toggleExpand };

    children = _jsx("span", {}, void 0, "Some children");
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_DescriptionWrapper.default, props, children));
  };

  const testExpanded = () => {
    props.expanded = true;
    render();
    expect(component).toMatchSnapshot();
  };

  it('should render the component with correct children', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render expanded data', () => {
    testExpanded();
  });

  it('should render extra info when expanded and beautified', () => {
    props.entry = props.entry.set('semantic', _immutable.default.fromJS({ beautified: true }));
    testExpanded();
  });

  describe('toggleExpand', () => {
    it('should trigger when the main section is clicked', () => {
      render();
      expect(toggleExpand).not.toHaveBeenCalled();
      component.find('.expand').simulate('click');
      expect(toggleExpand).toHaveBeenCalled();
    });
  });
});