import React, {Component, PropTypes} from 'react';

//import Loader from 'app/components/Elements/Loader';
//import {PDFJS} from '../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';
//PDFJS.workerSrc = '/pdf.worker.bundle.js';

export class PDFPage extends Component {

  renderPage() {
    if (!this.rendered && this.pdfPageView) {
      this.pdfPageView.draw()
      .catch((e) => e);
      this.rendered = true;
    }
    if (!this.rendered) {
      this.rendered = true;
      this.props.pdf.getPage(this.props.page).then(page => {
        const scale = 1;

        this.pdfPageView = new PDFJS.PDFPageView({
          container: this.refs.pageContainer,
          id: this.props.page,
          scale: scale,
          defaultViewport: page.getViewport(scale),
          textLayerFactory: new PDFJS.DefaultTextLayerFactory()
        });

        this.pdfPageView.setPdfPage(page);
        this.pdfPageView.draw()
        .catch((e) => e);
        //console.log(this.pdfPageView);
      });

    }
  }

  componentDidMount() {
    if (this.pageShouldRender()) {
      this.renderPage();
    }

    document.querySelector('.document-viewer').addEventListener('scroll', () => {
      if (this.pageShouldRender()) {
        this.renderPage();
      }
      else if (this.pdfPageView) {
        this.pdfPageView.cancelRendering();
        this.pdfPageView.destroy();
        this.rendered = false;
      }
    });
  }

  pageShouldRender() {
    const el = this.refs.pageContainer;
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) {
      return false;
    }

    return true;
  }

  render() {
    return (
      <div className="page" ref='pageContainer' style={{height: 1056}}>
      </div>
    );
  }
}

PDFPage.propTypes = {
  page: PropTypes.number,
  pdf: PropTypes.object
};

export default PDFPage;
