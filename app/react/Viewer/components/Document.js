import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import TextRange from 'batarange';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {resetDocumentViewer} from 'app/Viewer/actions/documentActions';
import 'app/Viewer/scss/document.scss';

export class Document extends Component {
  handleMouseUp() {
    if (window.getSelection().toString() === '') {
      this.props.unsetSelection();
      return;
    }
    this.onTextSelected();
  }

  onTextSelected() {
    let range = window.getSelection().getRangeAt(0);
    this.props.setSelection(TextRange.serialize(range, this.pagesContainer));
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
    this.props.resetDocumentViewer();
  }

  render() {
    const {document} = this.props;

    return (
      <div>
        <div className="document-viewer col-sm-8 col-sm-offset-2"
          ref={(ref) => this.pagesContainer = ref}
          onMouseUp={this.handleMouseUp.bind(this)}
          onTouchEnd={this.handleMouseUp.bind(this)}
        >
        {document.pages.map((page, index) => {
          let html = {__html: page};
          return <div key={index} dangerouslySetInnerHTML={html} className="document-article"/>;
        })}
        </div>
        {document.css.map((css, index) => {
          let html = {__html: css};
          return <style type="text/css" key={index} dangerouslySetInnerHTML={html}></style>;
        })}
      </div>
    );
  }
}

Document.propTypes = {
  document: PropTypes.object,
  setSelection: PropTypes.func,
  unsetSelection: PropTypes.func,
  resetDocumentViewer: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    selection: state.documentViewer.selection,
    document: state.documentViewer.document
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSelection, unsetSelection, resetDocumentViewer}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
