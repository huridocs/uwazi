"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _utils = require("../../utils");

var _PDFJS = _interopRequireWildcard(require("../PDFJS"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class PDFPage extends _react.Component {
  componentDidMount() {
    this.scrollCallback = this.scroll.bind(this);

    if (this.pageContainer && this.pageShouldRender()) {
      this.renderPage();
    }

    this.props.getViewportContainer().addEventListener('scroll', this.scrollCallback);
  }

  componentWillUnmount() {
    if (this.pdfPageView) {
      this.pdfPageView.destroy();
    }
    this.props.getViewportContainer().removeEventListener('scroll', this.scrollCallback);
  }

  scroll() {
    if (this.pageShouldRender() && !this.rendered) {
      this.renderPage();
    }

    if (!this.pageShouldRender() && this.pdfPageView) {
      this.pdfPageView.cancelRendering();
      this.pdfPageView.destroy();
      if (this.rendered) {
        this.props.onUnload(this.props.page);
      }
      this.rendered = false;
    }
  }

  pageShouldRender() {
    const pageRectangle = this.pageContainer.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    if (pageRectangle.right < 0 || pageRectangle.bottom < -500 || pageRectangle.left > vWidth || pageRectangle.top > vHeight + 500) {
      this.props.onHidden(this.props.page);
      return false;
    }
    this.checkVisibility(pageRectangle);
    return true;
  }

  checkVisibility(pageRectangle) {
    const viewportRect = this.props.getViewportContainer().getBoundingClientRect();

    const relativeElementRect = {
      top: pageRectangle.top - viewportRect.top,
      bottom: pageRectangle.bottom };


    const offsetTop = relativeElementRect.top < 0 ? -relativeElementRect.top : 0;
    const offsetBottom = pageRectangle.bottom - viewportRect.bottom > 0 ? pageRectangle.bottom - viewportRect.bottom : 0;
    const visibility = pageRectangle.height - offsetTop - offsetBottom;


    if (visibility > 0) {
      this.props.onVisible(this.props.page, visibility);
    }

    if (visibility < 0) {
      this.props.onHidden(this.props.page);
    }
  }

  renderPage() {
    if (!this.rendered && this.pdfPageView) {
      this.props.onLoading(this.props.page);
      this.pdfPageView.draw().
      catch(e => e);
      this.rendered = true;
      return;
    }
    if (!this.rendered) {
      this.props.onLoading(this.props.page);
      this.rendered = true;
      this.props.pdf.getPage(this.props.page).then(page => {
        const scale = 1;

        this.pdfPageView = new _PDFJS.default.PDFPageView({
          container: this.pageContainer,
          id: this.props.page,
          scale,
          defaultViewport: page.getViewport({ scale }),
          enhanceTextSelection: true,
          textLayerFactory: _PDFJS.textLayerFactory });


        this.pdfPageView.setPdfPage(page);
        this.pdfPageView.draw().
        then(() => {
          this.setState({ height: this.pdfPageView.viewport.height });
        }).
        catch(e => e);
      });
    }
  }

  render() {
    const style = { height: 1100 };
    if (this.state && this.state.height) {
      style.height = this.state.height + 20;
    }
    return _react.default.createElement("div", { id: `page-${this.props.page}`, className: "doc-page", ref: ref => {this.pageContainer = ref;}, style: style });
  }}


PDFPage.defaultProps = {
  getViewportContainer: () => _utils.isClient ? document.querySelector('.document-viewer') : null,
  onVisible: () => {},
  onHidden: () => {} };var _default =












PDFPage;exports.default = _default;