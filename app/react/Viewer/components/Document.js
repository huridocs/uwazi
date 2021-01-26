import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Loader from 'app/components/Elements/Loader';
import PDF from 'app/PDF';
import Immutable from 'immutable';
import { highlightSnippet } from 'app/Viewer/actions/uiActions';

import determineDirection from '../utils/determineDirection';

import { APIURL } from '../../config.js';

export class Document extends Component {
  constructor(props) {
    super(props);
    this.pages = { 1: 0 };
    this.previousMostVisible = props.page;
    this.pdfLoaded = this.pdfLoaded.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
    this.onTextDeselection = this.onTextDeselection.bind(this);
    this.onTextSelected = this.onTextSelected.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.highlightReference = this.highlightReference.bind(this);
  }

  componentDidMount() {
    this.props.unsetSelection();
  }

  componentDidUpdate(prevProps) {
    if (prevProps && prevProps.doc.get('_id') !== this.props.doc.get('_id')) {
      this.props.unsetSelection();
    }
    highlightSnippet(this.props.selectedSnippet, this.props.searchTerm);
  }

  onTextSelected(textSelection) {
    this.props.setSelection(textSelection, this.props.file._id);
    return this.props.deactivateReference();
  }

  onTextDeselection() {
    this.props.unsetSelection();
  }

  onDocumentReady() {
    this.props.onDocumentReady(this.props.doc);
  }

  handleClick() {
    if (this.props.executeOnClickHandler) {
      this.props.onClick();
    }
  }

  highlightReference(connection) {
    console.log(connection);
    const references = this.props.references.toJS();
    return this.props.activateReference(connection, this.props.file.pdfInfo, references);
  }

  pdfLoaded() {
    if (this.props.doScrollToActive) {
      const references = this.props.references.toJS();
      this.props.scrollToActive(
        references.find(r => r._id === this.props.activeReference),
        this.props.file.pdfInfo,
        references,
        this.props.doScrollToActive
      );
    }

    this.componentDidUpdate();
  }

  handleOver() {}

  renderPDF(file) {
    if (!(file._id && file.pdfInfo)) {
      return <Loader />;
    }

    return (
      <PDF
        onPageChange={this.props.onPageChange}
        onPDFReady={this.onDocumentReady}
        pdfInfo={file.pdfInfo}
        onLoad={this.pdfLoaded}
        file={`${APIURL}files/${file.filename}`}
        filename={file.filename}
        onTextSelection={this.onTextSelected}
        onTextDeselection={this.onTextDeselection}
        highlightReference={this.highlightReference}
        activeReference={this.props.activeReference}
      />
    );
  }

  render() {
    const doc = this.props.doc.toJS();
    const { file } = this.props;

    const Header = this.props.header;
    return (
      <div>
        <div className={`_${doc._id} document ${this.props.className} ${determineDirection(file)}`}>
          <Header />
          <div
            className="pages"
            ref={ref => (this.pagesContainer = ref)}
            onMouseOver={this.handleOver.bind(this)}
            onClick={this.handleClick}
          >
            {this.renderPDF(file)}
          </div>
        </div>
      </div>
    );
  }
}

Document.defaultProps = {
  onDocumentReady: () => {},
  onPageChange: () => {},
  onClick: () => {},
  file: {},
  searchTerm: '',
  page: 1,
  selectedSnippet: Immutable.fromJS({}),
  deactivateReference: () => {},
  header: () => false,
  activateReference: () => {},
  doScrollToActive: false,
  scrollToActive: () => {},
  activeReference: '',
  className: '',
  executeOnClickHandler: false,
};

Document.propTypes = {
  onPageChange: PropTypes.func,
  onDocumentReady: PropTypes.func,
  doc: PropTypes.object,
  file: PropTypes.object,
  selectedSnippet: PropTypes.instanceOf(Immutable.Map),
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  header: PropTypes.func,
  searchTerm: PropTypes.string,
  page: PropTypes.number,
  activateReference: PropTypes.func,
  doScrollToActive: PropTypes.bool,
  scrollToActive: PropTypes.func,
  activeReference: PropTypes.string,
  selection: PropTypes.object,
  references: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  executeOnClickHandler: PropTypes.bool,
  deactivateReference: PropTypes.func,
};

export default Document;
