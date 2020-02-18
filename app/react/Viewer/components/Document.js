import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Loader from 'app/components/Elements/Loader';
import PDF from 'app/PDF';
import ShowIf from 'app/App/ShowIf';
import Text from 'app/Viewer/utils/Text';
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
  }

  componentWillMount() {
    this.props.unsetSelection();
  }

  componentDidMount() {
    this.text = Text(this.pagesContainer);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.doc.get('_id') !== nextProps.doc.get('_id')) {
      this.props.unsetSelection();
    }
  }

  componentDidUpdate() {
    this.text.renderReferences(this.props.references.toJS());
    this.text.renderReferences(this.props.doc.toJS().toc || [], 'toc-ref', 'span');
    this.text.simulateSelection(this.props.selection, this.props.forceSimulateSelection);
    this.text.activate(this.props.activeReference);
    highlightSnippet(this.props.selectedSnippet, this.props.searchTerm);
  }

  onTextSelected() {
    this.props.setSelection(this.text.getSelection());
  }

  onDocumentReady() {
    this.props.onDocumentReady(this.props.doc);
  }

  handleOver() {}

  handleClick(e) {
    if (
      e.target.className &&
      e.target.className.indexOf('reference') !== -1 &&
      !this.text.selected()
    ) {
      const references = this.props.references.toJS();
      return this.props.activateReference(
        references.find(r => r._id === e.target.getAttribute('data-id')),
        this.props.file.pdfInfo,
        references
      );
    }
    if (this.props.executeOnClickHandler) {
      this.props.onClick();
    }
  }

  handleMouseUp() {
    if (this.props.disableTextSelection) {
      return;
    }

    if (!this.text.selected()) {
      this.props.unsetSelection();
      return;
    }
    this.onTextSelected();
  }

  pdfLoaded(range) {
    if (this.props.doScrollToActive) {
      const references = this.props.references.toJS();
      this.props.scrollToActive(
        references.find(r => r._id === this.props.activeReference),
        this.props.file.pdfInfo,
        references,
        this.props.doScrollToActive
      );
    }

    this.text.reset();
    this.text.reset('toc-ref');
    this.text.range(range);
    this.componentDidUpdate();
  }

  render() {
    const doc = this.props.doc.toJS();
    const { file } = this.props;

    const Header = this.props.header ? this.props.header : () => false;

    return (
      <div>
        <div className={`_${doc._id} document ${this.props.className} ${determineDirection(file)}`}>
          <Header />
          <div
            className="pages"
            ref={ref => (this.pagesContainer = ref)}
            onMouseUp={this.handleMouseUp.bind(this)}
            onTouchEnd={this.handleMouseUp.bind(this)}
            onClick={this.handleClick.bind(this)}
            onMouseOver={this.handleOver.bind(this)}
          >
            <ShowIf if={!file._id || !file.pdfInfo}>
              <Loader />
            </ShowIf>
            <ShowIf if={!!file._id && !!file.pdfInfo}>
              <PDF
                onPageChange={this.props.onPageChange}
                onPDFReady={this.onDocumentReady}
                pdfInfo={file.pdfInfo}
                onLoad={this.pdfLoaded}
                file={`${APIURL}files/${file.filename}`}
                filename={file.filename}
              />
            </ShowIf>
          </div>
        </div>
      </div>
    );
  }
}

Document.defaultProps = {
  onDocumentReady: () => {},
  onPageChange: () => {},
  selectedSnippet: Immutable.fromJS({}),
  file: {},
};

Document.propTypes = {
  onPageChange: PropTypes.func,
  onDocumentReady: PropTypes.func,
  doc: PropTypes.object,
  file: PropTypes.object,
  docHTML: PropTypes.object,
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  header: PropTypes.func,
  searchTerm: PropTypes.string,
  selectedSnippet: PropTypes.object,
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
  disableTextSelection: PropTypes.bool,
  forceSimulateSelection: PropTypes.bool,
};

export default Document;
