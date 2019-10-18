"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));

var _advancedSort = require("../../utils/advancedSort");

var _utils = require("../../utils");
var _PDFJS = _interopRequireDefault(require("../PDFJS"));
var _PDFPage = _interopRequireDefault(require("./PDFPage.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

class PDF extends _react.Component {
  constructor(props) {
    super(props);
    this.state = { pdf: { numPages: 0 } };
    this.pagesLoaded = {};
    this.loadDocument(props.file);
    this.currentPage = '1';
    this.pages = {};
    this.pdfReady = false;

    this.pageUnloaded = this.pageUnloaded.bind(this);
    this.pageLoading = this.pageLoading.bind(this);
    this.onPageVisible = this.onPageVisible.bind(this);
    this.onPageHidden = this.onPageHidden.bind(this);
  }

  componentDidMount() {
    if (this.pdfContainer) {
      document.addEventListener('textlayerrendered', e => {
        this.pageLoaded(e.detail.pageNumber);
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.filename !== null && this.props.filename !== nextProps.filename) {
      this.pagesLoaded = {};
      this.setState({ pdf: { numPages: 0 } }, () => {
        this.loadDocument(nextProps.file);
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.file !== this.props.file ||
    nextProps.filename !== this.props.filename ||
    nextProps.pdfInfo !== this.props.pdfInfo ||
    nextProps.style !== this.props.style ||
    nextState.pdf !== this.state.pdf;
  }

  componentDidUpdate() {
    if (this.state.pdf.numPages && !this.pdfReady) {
      this.pdfReady = true;
      this.props.onPDFReady();
    }
  }

  onPageVisible(page, visibility) {
    this.pages[page] = visibility;

    const pageWithMostVisibility = Object.keys(this.pages).reduce((memo, key) => {
      if (!this.pages[key - 1] || this.pages[key] > this.pages[key - 1]) {
        return key;
      }
      return memo;
    }, 1);

    if (this.currentPage !== pageWithMostVisibility) {
      this.currentPage = pageWithMostVisibility;
      this.props.onPageChange(Number(pageWithMostVisibility));
    }
  }

  onPageHidden(page) {
    delete this.pages[page];
  }

  loadDocument(file) {
    if (_utils.isClient) {
      _PDFJS.default.getDocument(file).promise.then(pdf => {
        this.setState({ pdf });
      });
    }
  }

  pageUnloaded(numPage) {
    delete this.pagesLoaded[numPage];
    this.loaded();
  }

  pageLoading(numPage) {
    this.pagesLoaded[numPage] = false;
  }

  pageLoaded(numPage) {
    this.pagesLoaded[numPage] = true;
    const allPagesLoaded = Object.keys(this.pagesLoaded).map(p => this.pagesLoaded[p]).filter(p => !p).length === 0;
    if (allPagesLoaded) {
      this.loaded();
    }
  }

  loaded() {
    const pages = Object.keys(this.pagesLoaded).map(n => parseInt(n, 10));

    const allConsecutives = (0, _advancedSort.advancedSort)(pages, { treatAs: 'number' }).reduce((memo, number) => {
      if (memo === false) {
        return memo;
      }

      if (memo === null) {
        return number;
      }

      return number - memo > 1 ? false : number;
    }, null);

    if (allConsecutives) {
      const pdfInfo = this.props.pdfInfo.toJS();
      const start = pdfInfo[Math.min.apply(null, Object.keys(this.pagesLoaded).map(n => parseInt(n, 10))) - 1] || { chars: 0 };
      const end = pdfInfo[Math.max.apply(null, Object.keys(this.pagesLoaded).map(n => parseInt(n, 10)))] || { chars: 0 };
      this.props.onLoad({
        start: start.chars,
        end: end.chars,
        pages });

    }
  }

  render() {
    return (
      _react.default.createElement("div", { ref: ref => {this.pdfContainer = ref;}, style: this.props.style },
      (() => {
        const pages = [];
        for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
          pages.push(_jsx(_PDFPage.default, {
            onUnload: this.pageUnloaded,
            onLoading: this.pageLoading,
            onVisible: this.onPageVisible,
            onHidden: this.onPageHidden,

            page: page,
            pdf: this.state.pdf }, page));

        }
        return pages;
      })()));


  }}


PDF.defaultProps = {
  filename: null,
  onPageChange: () => {},
  onPDFReady: () => {},
  style: {} };var _default =












PDF;exports.default = _default;