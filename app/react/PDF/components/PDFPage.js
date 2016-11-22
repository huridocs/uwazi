import React, {Component, PropTypes} from 'react';
import {isClient} from 'app/utils';

let PDFJS;
if (isClient) {
  PDFJS = require('../../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = '/pdf.worker.bundle.js';
}

export class PDFPage extends Component {

  renderPage() {
    if (!this.rendered && this.pdfPageView) {
      this.props.onLoading(this.props.page);
      this.pdfPageView.draw()
      .catch((e) => e);
      this.rendered = true;
    }
    if (!this.rendered) {
      this.props.onLoading(this.props.page);
      this.rendered = true;
      this.props.pdf.getPage(this.props.page).then(page => {
        const scale = 1;

        this.pdfPageView = new PDFJS.PDFPageView({
          container: this.refs.pageContainer,
          id: this.props.page,
          scale: scale,
          defaultViewport: page.getViewport(scale),
          enhanceTextSelection: true,
          textLayerFactory: new PDFJS.DefaultTextLayerFactory()
        });

        this.pdfPageView.setPdfPage(page);
        this.pdfPageView.draw()
        .catch((e) => e);
      });
    }
  }

  componentWillUnmount() {
    document.querySelector('.document-viewer').removeEventListener('scroll', this.scrollCallback);
  }

  componentDidMount() {
    this.scrollCallback = this.scroll.bind(this);

    if (this.pageShouldRender()) {
      this.renderPage();
    }

    document.querySelector('.document-viewer').addEventListener('scroll', this.scrollCallback);
  }

  scroll() {
    if (this.pageShouldRender()) {
      this.renderPage();
    } else if (this.pdfPageView) {
      this.pdfPageView.cancelRendering();
      this.pdfPageView.destroy();
      if (this.rendered) {
        this.props.onUnload(this.props.page);
      }
      this.rendered = false;
    }
  }

  pageShouldRender() {
    const el = this.refs.pageContainer;
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.right < 0 || rect.bottom < -1054 || rect.left > vWidth || rect.top > vHeight + 1054) {
      return false;
    }

    return true;
  }

  render() {
    return <div id={`page-${this.props.page}`}className="doc-page" ref='pageContainer' style={{height: 1054}}/>;
  }
}

PDFPage.propTypes = {
  page: PropTypes.number,
  pageHeight: PropTypes.number,
  onLoading: PropTypes.func,
  onUnload: PropTypes.func,
  pdf: PropTypes.object
};

export default PDFPage;
