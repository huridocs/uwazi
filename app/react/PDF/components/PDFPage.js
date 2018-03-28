import PropTypes from 'prop-types';
import React, { Component } from 'react';

import PDFJS from '../PDFJS';

class PDFPage extends Component {
  componentDidMount() {
    this.scrollCallback = this.scroll.bind(this);

    if (this.pageShouldRender()) {
      this.renderPage();
    }

    document.querySelector('.document-viewer').addEventListener('scroll', this.scrollCallback);
  }

  componentWillUnmount() {
    if (this.pdfPageView) {
      this.pdfPageView.destroy();
    }
    document.querySelector('.document-viewer').removeEventListener('scroll', this.scrollCallback);
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
    const el = this.pageContainer;
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.right < 0 || rect.bottom < -500 || rect.left > vWidth || rect.top > vHeight + 500) {
      return false;
    }

    return true;
  }

  renderPage() {
    if (!this.rendered && this.pdfPageView) {
      this.props.onLoading(this.props.page);
      this.pdfPageView.draw()
      .catch(e => e);
      this.rendered = true;
    }
    if (!this.rendered) {
      this.props.onLoading(this.props.page);
      this.rendered = true;
      this.props.pdf.getPage(this.props.page).then((page) => {
        const scale = 1;

        this.pdfPageView = new PDFJS.PDFPageView({
          container: this.pageContainer,
          id: this.props.page,
          scale,
          defaultViewport: page.getViewport(scale),
          enhanceTextSelection: true,
          textLayerFactory: new PDFJS.DefaultTextLayerFactory()
        });

        this.pdfPageView.setPdfPage(page);
        this.pdfPageView.draw()
        .then(() => {
          this.setState({ height: this.pdfPageView.viewport.height });
        })
        .catch(e => e);
      });
    }
  }

  render() {
    const style = { height: 1100 };
    if (this.state && this.state.height) {
      style.height = this.state.height + 20;
    }
    return <div id={`page-${this.props.page}`} className="doc-page" ref={(ref) => { this.pageContainer = ref; }}style={style}/>;
  }
}

PDFPage.propTypes = {
  page: PropTypes.number.isRequired,
  onLoading: PropTypes.func.isRequired,
  onUnload: PropTypes.func.isRequired,
  pdf: PropTypes.object.isRequired
};

export default PDFPage;
