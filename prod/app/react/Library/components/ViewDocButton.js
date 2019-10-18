"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.mapStateToProps = mapStateToProps;exports.mapDispatchToProps = mapDispatchToProps;exports.default = exports.ViewDocButton = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _redux = require("redux");
var _reactRedux = require("react-redux");
var _immutable = require("immutable");
var _I18N = require("../../I18N");
var _UI = require("../../UI");
var _BasicReducer = require("../../BasicReducer");
var _url = _interopRequireDefault(require("url"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

function getDocumentUrlQuery(searchTerm, targetReference) {
  const query = {};
  if (searchTerm) {
    query.searchTerm = searchTerm;
  }
  if (targetReference) {
    query.ref = targetReference.get('_id');
  }
  return query;
}

class ViewDocButton extends _react.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();
    const { targetReference, openReferencesTab } = this.props;
    if (targetReference) {
      openReferencesTab();
    }
  }

  render() {
    const { sharedId, processed, searchTerm, file, targetReference } = this.props;
    const isEntity = !file;
    const type = isEntity ? 'entity' : 'document';

    const pathname = `/${type}/${sharedId}`;
    const query = getDocumentUrlQuery(searchTerm, targetReference);
    const documentViewUrl = _url.default.format({
      pathname,
      query });


    if (!processed && !isEntity) {
      return false;
    }

    return (
      _jsx(_I18N.I18NLink, { to: documentViewUrl, className: "btn btn-default btn-xs", onClick: this.onClick }, void 0,
      _jsx(_UI.Icon, { icon: "angle-right", directionAware: true }), " ", (0, _I18N.t)('System', 'View')));


  }}exports.ViewDocButton = ViewDocButton;


ViewDocButton.defaultProps = {
  searchTerm: '',
  processed: false,
  targetReference: null };











function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : '' };

}

function mapDispatchToProps(dispatch) {
  return (0, _redux.bindActionCreators)({
    openReferencesTab: () => _dispatch => _dispatch(_BasicReducer.actions.set('viewer.sidepanel.tab', 'references')) },
  dispatch);
}var _default =

(0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(ViewDocButton);exports.default = _default;