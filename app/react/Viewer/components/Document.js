import React, {Component, PropTypes} from 'react';

import Text from 'app/Viewer/utils/Text';
import 'app/Viewer/scss/conversion_base.scss';
import 'app/Viewer/scss/document.scss';

export class Document extends Component {
  handleMouseUp() {
    if(this.props.disableTextSelection) {
      return;
    }

    if (!this.text.selected()) {
      this.props.unsetSelection();
      return;
    }
    this.onTextSelected();
  }

  handleClick() {
    if (this.props.executeOnClickHandler) {
      this.props.onClick();
    }
  }

  handleOver(e) {
    if (e.target.className === 'reference') {
      return this.props.highlightReference(e.target.getAttribute('x-id'));
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
    this.text.simulateSelection(this.props.selection);
    this.text.highlight(this.props.highlightedReference);
  }

  render() {
    const doc = this.props.doc.toJS();
    const docHTML = this.props.docHTML.toJS();

    return (
      <div>
        <div
          className={'_' + doc._id + ' document ' + this.props.className}
          ref={(ref) => this.pagesContainer = ref}
          onMouseUp={this.handleMouseUp.bind(this)}
          onTouchEnd={this.handleMouseUp.bind(this)}
          onClick={this.handleClick.bind(this)}
          onMouseOver={this.handleOver.bind(this)}
        >
        {docHTML.pages.map((page, index) => {
          let html = {__html: page};
          return <div key={index} dangerouslySetInnerHTML={html} />;
        })}
        </div>
        <style type="text/css" dangerouslySetInnerHTML={{__html: docHTML.css}}></style>
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
  highlightedReference: PropTypes.string,
  selection: PropTypes.object,
  references: PropTypes.array,
  className: PropTypes.string,
  onClick: PropTypes.func,
  executeOnClickHandler: PropTypes.bool,
  disableTextSelection: PropTypes.bool
};

export default Document;
