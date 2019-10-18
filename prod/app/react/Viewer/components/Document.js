"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.Document = void 0;require("../scss/conversion_base.scss");
require("../scss/document.scss");

var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _PDF = _interopRequireDefault(require("../../PDF"));
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));
var _Text = _interopRequireDefault(require("../utils/Text"));
var _immutable = _interopRequireDefault(require("immutable"));
var _uiActions = require("../actions/uiActions");

var _determineDirection = _interopRequireDefault(require("../utils/determineDirection"));

var _config = require("../../config.js");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class Document extends _react.Component {
  constructor(props) {
    super(props);
    this.pages = { 1: 0 };
    this.previousMostVisible = props.page;
    this.pdfLoaded = this.pdfLoaded.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
  }

  componentWillMount() {
    this.props.unsetSelection();
  }

  componentDidMount() {
    this.text = (0, _Text.default)(this.pagesContainer);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.doc.get('_id') !== nextProps.doc.get('_id')) {
      this.props.unsetSelection();
    }
  }

  componentDidUpdate() {
    this.text.renderReferences(this.props.references.toJS());
    this.text.renderReferences(this.props.doc.toJS().toc || [], 'toc-ref', 'span');
    this.text.simulateSelection(this.props.selection, this.props.forceSimulateSelection);
    this.text.activate(this.props.activeReference);
    (0, _uiActions.highlightSnippet)(this.props.selectedSnippet, this.props.searchTerm);
  }

  onTextSelected() {
    this.props.setSelection(this.text.getSelection());
  }

  onDocumentReady() {
    this.props.onDocumentReady(this.props.doc);
  }

  handleOver() {}

  handleClick(e) {
    if (e.target.className && e.target.className.indexOf('reference') !== -1 && !this.text.selected()) {
      const references = this.props.references.toJS();
      return this.props.activateReference(
      references.find(r => r._id === e.target.getAttribute('data-id')),
      this.props.doc.get('pdfInfo').toJS(),
      references);

    }
    if (this.props.executeOnClickHandler) {
      this.props.onClick();
    }
  }

  handleMouseUp() {
    if (this.props.disableTextSelection) {
      return;
    }

    if (!this.text.selected()) {
      this.props.unsetSelection();
      return;
    }
    this.onTextSelected();
  }

  pdfLoaded(range) {
    if (this.props.doScrollToActive) {
      const references = this.props.references.toJS();
      this.props.scrollToActive(
      references.find(r => r._id === this.props.activeReference),
      this.props.doc.get('pdfInfo').toJS(),
      references,
      this.props.doScrollToActive);

    }

    this.text.reset();
    this.text.reset('toc-ref');
    this.text.range(range);
    this.componentDidUpdate();
  }

  render() {
    const doc = this.props.doc.toJS();

    const Header = this.props.header || function () {
      return false;
    };

    return (
      _jsx("div", {}, void 0,
      _jsx("div", { className: `_${doc._id} document ${this.props.className} ${(0, _determineDirection.default)(doc.file || {})}` }, void 0,
      _jsx(Header, {}),
      _react.default.createElement("div", {
        className: "pages",
        ref: ref => this.pagesContainer = ref,
        onMouseUp: this.handleMouseUp.bind(this),
        onTouchEnd: this.handleMouseUp.bind(this),
        onClick: this.handleClick.bind(this),
        onMouseOver: this.handleOver.bind(this) },

      _jsx(_ShowIf.default, { if: !doc._id || !doc.pdfInfo }, void 0, _jsx(_Loader.default, {})),
      _jsx(_ShowIf.default, { if: !!doc._id && !!doc.pdfInfo }, void 0,
      _jsx(_PDF.default, {
        onPageChange: this.props.onPageChange,
        onPDFReady: this.onDocumentReady,
        pdfInfo: this.props.doc.get('pdfInfo'),
        onLoad: this.pdfLoaded,
        file: `${_config.APIURL}documents/download?_id=${doc._id}`,
        filename: doc.file ? doc.file.filename : null }))))));






  }}exports.Document = Document;


Document.defaultProps = {
  onDocumentReady: () => {},
  onPageChange: () => {},
  selectedSnippet: _immutable.default.fromJS({}) };var _default =


























Document;exports.default = _default;