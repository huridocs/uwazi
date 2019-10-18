"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.mapDispatchToProps = void 0;var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _reactRedux = require("react-redux");
var _redux = require("redux");

var _Multireducer = require("../../Multireducer");
var _libraryActions = require("../../Library/actions/libraryActions");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

class EntityInfo extends _react.Component {
  constructor(props) {
    super(props);
    this.getAndSelect = this.getAndSelect.bind(this);
  }

  async getAndSelect(sharedId) {
    const { getAndSelectDocument } = this.props;
    getAndSelectDocument(sharedId);
  }

  render() {
    const { entity, tag, classname, children } = this.props;
    return _react.default.createElement(
    tag,
    { className: classname, onClick: () => this.getAndSelect(entity) },
    children);

  }}


EntityInfo.defaultProps = {
  entity: '',
  tag: 'div',
  children: '',
  classname: '' };














const mapDispatchToProps = dispatch => (0, _redux.bindActionCreators)(
{ getAndSelectDocument: _libraryActions.getAndSelectDocument }, (0, _Multireducer.wrapDispatch)(dispatch, 'library'));exports.mapDispatchToProps = mapDispatchToProps;var _default =


(0, _reactRedux.connect)(() => ({}), mapDispatchToProps)(EntityInfo);exports.default = _default;