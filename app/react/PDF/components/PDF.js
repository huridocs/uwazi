import PropTypes from 'prop-types';
import React, { Component } from 'react';

import PDFPage from './PDFPage.js';
import '../../../../node_modules/pdfjs-dist/web/pdf_viewer.css';

import {isClient} from 'app/utils';
import {advancedSort} from 'app/utils/advancedSort';

let PDFJS;
if (isClient) {
  PDFJS = require('../../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = '/pdf.worker.bundle.js';
}

export class PDF extends Component {

  constructor(props) {
    super(props);
    this.state = {pdf: {numPages: 0}};
    this.pagesLoaded = {};
    if (isClient) {
      PDFJS.getDocument(props.file).then(pdf => {
        this.setState({pdf});
      });
    }
  }

  componentDidMount() {
    this.refs.pdfContainer.addEventListener('textlayerrendered', (e) => {
      this.pageLoaded(e.detail.pageNumber);
    });
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
    let allPagesLoaded = Object.keys(this.pagesLoaded).map(p => this.pagesLoaded[p]).filter(p => !p).length === 0;
    if (allPagesLoaded) {
      this.loaded();
    }
  }

  loaded() {
    const pages = Object.keys(this.pagesLoaded).map((n) => parseInt(n, 10));

    const allConsecutives = advancedSort(pages, {treatAs: 'number'}).reduce((memo, number) => {
      if (memo === false) {
        return memo;
      }

      if (memo === null) {
        return number;
      }

      return number - memo > 1 ? false : number;
    }, null);

    if (allConsecutives) {
      const start = this.props.pdfInfo[Math.min.apply(null, Object.keys(this.pagesLoaded).map(n => parseInt(n, 10))) - 1] || {chars: 0};
      const end = this.props.pdfInfo[Math.max.apply(null, Object.keys(this.pagesLoaded).map(n => parseInt(n, 10)))] || {chars: 0};
      this.props.onLoad({
        start: start.chars,
        end: end.chars
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.filename !== null && this.props.filename !== nextProps.filename) {
      this.pagesLoaded = {};
      this.setState({pdf: {numPages: 0}}, () => {
        PDFJS.getDocument(nextProps.file).then(pdf => {
          this.setState({pdf});
        });
      });
    }
  }

  render() {
    return (
      <div ref='pdfContainer' style={this.props.style}>
        {(() => {
          let pages = [];
          for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
            pages.push(<PDFPage onUnload={this.pageUnloaded.bind(this)}
              onLoading={this.pageLoading.bind(this)} key={page} page={page} pdf={this.state.pdf} />);
          }
          return pages;
        })()}
      </div>
    );
  }
}

PDF.propTypes = {
  file: PropTypes.string,
  pdfInfo: PropTypes.object,
  filename: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func
};

export default PDF;
