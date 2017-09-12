import PropTypes from 'prop-types';
import React, {Component} from 'react';

import Text from 'app/Viewer/utils/Text';
import Loader from 'app/components/Elements/Loader';
import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';
import PDF from 'app/PDF';
import ShowIf from 'app/App/ShowIf';
import {highlightSnippets} from 'app/Viewer/actions/uiActions';
import {APIURL} from '../../config.js';

export class Document extends Component {
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

  handleClick(e) {
    if (e.target.className && e.target.className.indexOf('reference') !== -1 && !this.text.selected()) {
      return this.props.activateReference(
        this.props.references.find(r => r._id === e.target.getAttribute('data-id')),
        this.props.doc.get('pdfInfo').toJS(),
        this.props.references
      );
    }
    if (this.props.executeOnClickHandler) {
      this.props.onClick();
    }
  }

  handleOver(e) {
    if (e.target.className && e.target.className.indexOf('reference') !== -1) {
      return this.props.highlightReference(e.target.getAttribute('data-id'));
    }

    this.props.highlightReference(null);
  }

  componentDidMount() {
    this.text = Text(this.pagesContainer);
  }

  onTextSelected() {
    this.props.setSelection(this.text.getSelection());
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.doc.get('_id') !== nextProps.doc.get('_id')) {
      this.props.unsetSelection();
    }
  }

  componentWillMount() {
    this.props.unsetSelection();
  }

  componentDidUpdate() {
    this.text.renderReferences(this.props.references);
    this.text.renderReferences(this.props.doc.toJS().toc || [], 'toc-ref', 'span');
    this.text.simulateSelection(this.props.selection, this.props.forceSimulateSelection);
    this.text.highlight(this.props.highlightedReference);
    this.text.activate(this.props.activeReference);

    if (this.props.searchTerm) {
      this.props.highlightSnippets(this.props.snippets, this.text.charRange.pages);
    }
  }

  pdfLoaded(range) {
    if (this.props.doScrollToActive) {
      this.props.scrollToActive(
        this.props.references.find(r => r._id === this.props.activeReference),
        this.props.doc.get('pdfInfo').toJS(),
        this.props.references,
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

    const Header = this.props.header || function () {
      return false;
    };

    return (
      <div>
        <div className={'_' + doc._id + ' document ' + this.props.className} >
          <Header/>
          <div className="pages"
            ref={(ref) => this.pagesContainer = ref}
            onMouseUp={this.handleMouseUp.bind(this)}
            onTouchEnd={this.handleMouseUp.bind(this)}
            onClick={this.handleClick.bind(this)}
            onMouseOver={this.handleOver.bind(this)}
          >
            <ShowIf if={!doc._id || !doc.pdfInfo}>
              <Loader />
            </ShowIf>
            <ShowIf if={!!doc._id && !!doc.pdfInfo}>
              <PDF
                pdfInfo={doc.pdfInfo}
                page={this.props.page}
                onLoad={this.pdfLoaded.bind(this)}
                file={`${APIURL}documents/download?_id=${doc._id}`}
                filename={doc.file ? doc.file.filename : null}/>
            </ShowIf>
          </div>
        </div>
      </div>
    );
  }
}

Document.defaultProps = {
  highlightSnippets
};

Document.propTypes = {
  doc: PropTypes.object,
  docHTML: PropTypes.object,
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  highlightReference: PropTypes.func,
  highlightSnippets: PropTypes.func,
  header: PropTypes.func,
  searchTerm: PropTypes.string,
  snippets: PropTypes.object,
  page: PropTypes.number,
  activateReference: PropTypes.func,
  doScrollToActive: PropTypes.bool,
  scrollToActive: PropTypes.func,
  highlightedReference: PropTypes.string,
  activeReference: PropTypes.string,
  selection: PropTypes.object,
  references: PropTypes.array,
  className: PropTypes.string,
  onClick: PropTypes.func,
  executeOnClickHandler: PropTypes.bool,
  disableTextSelection: PropTypes.bool,
  forceSimulateSelection: PropTypes.bool
};

export default Document;
