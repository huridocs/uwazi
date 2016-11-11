import React, {Component, PropTypes} from 'react';

//import Loader from 'app/components/Elements/Loader';
import {PDFJS} from '../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';
PDFJS.workerSrc = '/pdf.worker.bundle.js';
import PDFPage from './PDFPage.js';
import '../../../../node_modules/pdfjs-dist/web/pdf_viewer.css';

export class PDF extends Component {

  constructor(props) {
    super(props);
    this.pagesLoaded = 0;
    PDFJS.getDocument(props.file).then(pdf => {
      this.setState({pdf});
      this.start = new Date().getTime();
    });
  }

  pageLoaded() {
    this.pagesLoaded += 1;
    if (this.pagesLoaded === this.state.pdf.numPages) {
      console.log(new Date().getTime() - this.start);
      this.props.onLoad();
    }
  }

  render() {
    if (!this.state) {
      return false;
    }

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
