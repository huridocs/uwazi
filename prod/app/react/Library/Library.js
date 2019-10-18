"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _react = _interopRequireDefault(require("react"));
var _RouteHandler = _interopRequireDefault(require("../App/RouteHandler"));
var _DocumentsList = _interopRequireDefault(require("./components/DocumentsList"));
var _LibraryModeToggleButtons = _interopRequireDefault(require("./components/LibraryModeToggleButtons"));
var _libraryActions = require("./actions/libraryActions");
var _requestState = _interopRequireDefault(require("./helpers/requestState"));
var _SearchButton = _interopRequireDefault(require("./components/SearchButton"));
var _LibraryLayout = _interopRequireDefault(require("./LibraryLayout"));
var _Multireducer = require("../Multireducer");
var _ImportProgress = _interopRequireDefault(require("../Uploads/components/ImportProgress"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Library extends _RouteHandler.default {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
  }

  static renderTools() {
    return (
      _jsx(_react.default.Fragment, {}, void 0,
      _jsx("div", { className: "searchBox" }, void 0,
      _jsx(_SearchButton.default, { storeKey: "library" })),

      _jsx(_ImportProgress.default, {})));


  }

  static async requestState(requestParams, globalResources) {
    return (0, _requestState.default)(requestParams, globalResources);
  }

  // setReduxState(state) {
  //   setReduxState(state, this.context);
  // }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  componentWillMount() {
    const { dispatch } = this.context.store;
    (0, _Multireducer.wrapDispatch)(dispatch, 'library')((0, _libraryActions.enterLibrary)());
    this.zoomIn = () => (0, _Multireducer.wrapDispatch)(dispatch, 'library')((0, _libraryActions.zoomIn)());
    this.zoomOut = () => (0, _Multireducer.wrapDispatch)(dispatch, 'library')((0, _libraryActions.zoomOut)());
  }

  render() {
    return (
      _jsx(_LibraryLayout.default, {}, void 0,
      _jsx(_LibraryModeToggleButtons.default, { storeKey: "library", zoomIn: this.zoomIn, zoomOut: this.zoomOut }),
      _jsx(_DocumentsList.default, { storeKey: "library" })));


  }}exports.default = Library;