import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Loader } from 'app/components/Elements/Loader';
import { PDF } from 'app/PDF';
import Immutable from 'immutable';
import { highlightSnippet } from 'app/Viewer/actions/uiActions';

import determineDirection from '../utils/determineDirection';

import { APIURL } from '../../config.js';

class Document extends Component {
  constructor(props) {
    super(props);
    //TODO: remove this if this is not needed anymore
    // eslint-disable-next-line react/no-unused-class-component-methods
    this.pages = { 1: 0 };
    // eslint-disable-next-line react/no-unused-class-component-methods
    this.previousMostVisible = props.page;
    this.pdfLoaded = this.pdfLoaded.bind(this);
    this.onDocumentReady = this.onDocumentReady.bind(this);
    this.onTextDeselection = this.onTextDeselection.bind(this);
    this.onTextSelected = this.onTextSelected.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.highlightReference = this.highlightReference.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps && prevProps.doc.get('_id') !== this.props.doc.get('_id')) {
      this.props.unsetSelection();
    }
    highlightSnippet(this.props.selectedSnippet, this.props.searchTerm);
  }

  onTextSelected(textSelection) {
    if (this.props.disableTextSelection) {
      return;
    }
    const selectionRectangles = textSelection.selectionRectangles.map(
      ({ regionId, ...otherProps }) => ({ ...otherProps, page: regionId })
    );
    this.props.setSelection({ ...textSelection, selectionRectangles }, this.props.file._id);
    this.props.deactivateReference();
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

  highlightReference(connection, referenceGroup) {
    return this.props.activateReference(
      connection,
      referenceGroup,
      undefined,
      undefined,
      !this.props.disableTextSelection
    );
  }

  pdfLoaded() {
    if (this.props.doScrollToActive) {
      const references = this.props.references.toJS();
      this.props.scrollToActive(
        references.find(r => r._id === this.props.activeReference),
        references,
        this.props.doScrollToActive
      );
    }
    this.props.onPDFLoaded();
    this.componentDidUpdate();
  }

  handleOver() {}

  renderPDF(file) {
    if (!file._id) {
      return <Loader />;
    }

    return (
      <PDF
        onPageChange={this.props.onPageChange}
        onPDFReady={this.onDocumentReady}
        onPageLoaded={this.props.onPageLoaded}
        onLoad={this.pdfLoaded}
        file={`${APIURL}files/${file.filename}`}
        filename={file.filename}
        onTextSelection={this.onTextSelected}
        onTextDeselection={this.onTextDeselection}
        highlightReference={this.highlightReference}
        activeReference={this.props.activeReference}
        key={file.filename}
      />
    );
  }

  render() {
    const { file } = this.props;

    const Header = this.props.header;
    return (
      <div>
        <div
          className={`_${this.props.doc.get('_id')} document ${
            this.props.className
          } ${determineDirection(file)}`}
        >
          <Header />
          <div
            className="pages"
            // eslint-disable-next-line react/no-unused-class-component-methods
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
  onPageLoaded: () => {},
  onDocumentReady: () => {},
  onPageChange: () => {},
  onClick: () => {},
  onPDFLoaded: () => {},
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
  onPDFLoaded: PropTypes.func,
  onPageLoaded: PropTypes.func,
  doc: PropTypes.object,
  file: PropTypes.object,
  selectedSnippet: PropTypes.instanceOf(Immutable.Map),
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  disableTextSelection: PropTypes.bool,
  header: PropTypes.func,
  searchTerm: PropTypes.string,
  page: PropTypes.number,
  activateReference: PropTypes.func,
  doScrollToActive: PropTypes.bool,
  scrollToActive: PropTypes.func,
  activeReference: PropTypes.string,
  references: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  executeOnClickHandler: PropTypes.bool,
  deactivateReference: PropTypes.func,
};

export { Document };

export default Document;
