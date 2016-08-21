import React, {Component, PropTypes} from 'react';

import Text from 'app/Viewer/utils/Text';
import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';
import Loader from 'app/components/Elements/Loader';

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
      return this.props.activateReference(e.target.getAttribute('data-id'), this.props.references);
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

  componentDidUpdate() {
    this.text.renderReferences(this.props.references);
    this.text.renderReferences(this.props.doc.toJS().toc || [], 'toc');
    this.text.simulateSelection(this.props.selection, this.props.forceSimulateSelection);
    this.text.highlight(this.props.highlightedReference);
    this.text.activate(this.props.activeReference);
  }

  render() {
    const doc = this.props.doc.toJS();
    const docHTML = this.props.docHTML.toJS();

    const Header = this.props.header || function () {
      return false;
    };

    return (
      <div>
        <div className={'_' + doc._id + ' document ' + this.props.className} >
          <Header/>
          {(() => {
            if (!docHTML.pages.length) {
              return <Loader/>;
            }
          })()}
          <div className="pages"
            ref={(ref) => this.pagesContainer = ref}
            onMouseUp={this.handleMouseUp.bind(this)}
            onTouchEnd={this.handleMouseUp.bind(this)}
            onClick={this.handleClick.bind(this)}
            onMouseOver={this.handleOver.bind(this)}
          >
            {docHTML.pages.map((page, index) => {
              let html = {__html: page};
              return <div className='page' key={index} dangerouslySetInnerHTML={html} />;
            })}
          </div>
        </div>
        <style type="text/css" dangerouslySetInnerHTML={{__html: docHTML.css}}></style>
        <style type="text/css" dangerouslySetInnerHTML={{__html: docHTML.fonts}}></style>
      </div>
    );
  }
}

Document.propTypes = {
  doc: PropTypes.object,
  docHTML: PropTypes.object,
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  highlightReference: PropTypes.func,
  header: PropTypes.func,
  activateReference: PropTypes.func,
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
