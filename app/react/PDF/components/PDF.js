import React, {Component, PropTypes} from 'react';

import ShowIf from 'app/App/ShowIf';
import PDFPage from './PDFPage.js';
import '../../../../node_modules/pdfjs-dist/web/pdf_viewer.css';

import {isClient} from 'app/utils';

let PDFJS;
if (isClient) {
  PDFJS = require('../../../../node_modules/pdfjs-dist/web/pdf_viewer.js').PDFJS;
  PDFJS.workerSrc = '/pdf.worker.bundle.js';
}

export class PDF extends Component {

  constructor(props) {
    super(props);
    this.state = {pdf: {numPages: 0}};
    this.pagesLoaded = 0;
    PDFJS.getDocument(props.file).then(pdf => {
      this.setState({pdf});
    });
  }

  pageLoaded() {
    this.pagesLoaded += 1;
    if (this.pagesLoaded === this.state.pdf.numPages) {
      this.props.onLoad();
    }
  }

  render() {
    return (
      <div>
        {(() => {
          let pages = [];
          for (let page = 1; page <= this.state.pdf.numPages; page += 1) {
            pages.push(<PDFPage onLoad={this.pageLoaded.bind(this)} key={page} page={page} pdf={this.state.pdf} />);
          }
          return pages;
        })()}
      </div>
    );
  }
}

PDF.propTypes = {
  file: PropTypes.string,
  onLoad: PropTypes.func
};

export default PDF;
