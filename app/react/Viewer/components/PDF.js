import React, {Component, PropTypes} from 'react';

//import Loader from 'app/components/Elements/Loader';
//import {PDFJS} from '../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';
import PDFPage from './PDFPage.js';
//PDFJS.workerSrc = '/pdf.worker.bundle.js';
import '../../../../node_modules/pdfjs-dist/web/pdf_viewer.css';

export class PDF extends Component {

  componentDidMount() {
    PDFJS.getDocument(this.props.file).then(pdf => {
      //let pageIndex = 1;
      //this.renderPage(pdf, pageIndex);

      this.setState({ pdf });

      //document.querySelector('.document-viewer').addEventListener('scroll', () => {
      //const scrollTop = document.querySelector('.document-viewer').scrollTop;
      //console.log(scrollTop);
      //if (scrollTop > 800 * pageIndex) {
      //pageIndex += 1;
      //this.renderPage(pdf, pageIndex);
      //}
      //});
    });
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
            pages.push(<PDFPage key={page} page={page} pdf={this.state.pdf} />);
          }
          return pages;
        })()}
      </div>
    );
  }
}

PDF.propTypes = {
  file: PropTypes.string
};

export default PDF;
