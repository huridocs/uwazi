"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");
var _Multireducer = _interopRequireDefault(require("../../../Multireducer"));
var _BasicReducer = require("../../../BasicReducer");
var _actions = _interopRequireDefault(require("../../actions"));

var _DocumentResultsPanel = _interopRequireWildcard(require("../DocumentResultsPanel"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('DocumentResultsPanel', () => {
  let state;
  let store;
  let localProps;
  let dispatch;

  beforeEach(() => {
    localProps = {
      storeKey: 'library' };

    dispatch = jest.fn().mockImplementation(() => Promise.resolve());
    spyOn(_Multireducer.default, 'wrapDispatch').and.returnValue(dispatch);
    state = {
      templates: [],
      semanticSearch: {
        selectedDocument: _immutable.default.fromJS({ _id: 'sharedId' }) },

      library: {
        sidepanel: {
          references: [],
          tab: 'tab',
          metadata: [],
          metadataForm: {
            $form: { pristine: true } } },


        search: {
          searchTerm: 'search term' } } };



    store = {
      getState: jest.fn(() => state),
      subscribe: jest.fn(),
      dispatch };

  });
  const render = () => (0, _enzyme.shallow)(_jsx(_DocumentResultsPanel.default, { store: store }));
  const getProps = () => _objectSpread({},
  (0, _DocumentResultsPanel.mapDispatchToProps)(dispatch, localProps), {},
  (0, _DocumentResultsPanel.mapStateToProps)(state, localProps));


  it('should render DocumentSidePanel with the current semantic search document', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should unselect semantic search document when panel is closed', () => {
    spyOn(_actions.default, 'unselectSemanticSearchDocument');
    const props = getProps();
    props.closePanel();
    expect(_actions.default.unselectSemanticSearchDocument).toHaveBeenCalled();
  });

  it('should set sidepanel tab when showTab is clicked', () => {
    spyOn(_BasicReducer.actions, 'set');
    const props = getProps();
    props.showTab('newTab');
    expect(_BasicReducer.actions.set).toHaveBeenCalledWith('library.sidepanel.tab', 'newTab');
  });
});