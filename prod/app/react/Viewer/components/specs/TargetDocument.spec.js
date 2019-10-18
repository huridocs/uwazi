"use strict";
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _TargetDocument = _interopRequireDefault(require("../TargetDocument"));
var viewerSelectors = _interopRequireWildcard(require("../../selectors"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('TargetDocument', () => {
  let component;
  let store;
  const mockStore = (0, _reduxMockStore.default)([]);

  const state = {
    documentViewer: {
      uiState: _immutable.default.fromJS({
        reference: { targetRange: { selection: 'selection' } } }),

      targetDoc: _immutable.default.fromJS({ name: 'document' }),
      targetDocHTML: _immutable.default.fromJS({ pages: 'pages', css: 'css' }),
      selectedTargetReferences: _immutable.default.fromJS({ keysOf: 'selectTargetReferences' }) } };



  const render = () => {
    store = mockStore(state);
    component = (0, _enzyme.shallow)(_jsx(_TargetDocument.default, {}), { context: { store } });
  };

  it('should map props', () => {
    spyOn(viewerSelectors, 'selectTargetReferences').and.
    callFake(fnSstate => fnSstate.documentViewer.selectedTargetReferences);
    render();

    const props = component.props();
    expect(props.selection).toEqual({ selection: 'selection' });
    expect(props.doc.toJS().name).toBe('document');
    expect(props.docHTML.toJS()).toEqual({ pages: 'pages', css: 'css' });
    expect(props.references.toJS().keysOf).toBe('selectTargetReferences');
    expect(props.className).toBe('targetDocument');
  });
});