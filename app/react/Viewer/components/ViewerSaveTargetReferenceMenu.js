import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';
import {loadTargetDocument} from 'app/Viewer/actions/documentActions';

export class ViewerSaveTargetReferenceMenu extends Component {
  handleClick() {
    if (this.props.targetDocument) {
      let reference = this.props.reference;
      reference.sourceDocument = this.props.sourceDocument;
      return this.props.saveReference(reference);
    }
    if (this.props.reference.targetDocument) {
      this.props.loadTargetDocument(this.props.reference.targetDocument);
    }
  }
  render() {
    let className = 'fa-hand-pointer-o';
    if (this.props.targetDocument) {
      className = 'fa-save';
    }
    if (this.props.reference.targetDocument) {
      className = 'fa-arrow-right';
    }
    return (
      <div>
        <div
        onClick={() => this.handleClick()}
        className="float-btn__main">
          <i className={'fa ' + className}></i>
        </div>
      </div>
    );
  }
}

ViewerSaveTargetReferenceMenu.propTypes = {
  loadTargetDocument: PropTypes.func,
  saveReference: PropTypes.func,
  sourceDocument: PropTypes.string,
  targetDocument: PropTypes.string,
  reference: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveReference, loadTargetDocument}, dispatch);
}

function mapStateToProps(state) {
  return {
    reference: state.documentViewer.uiState.toJS().reference,
    sourceDocument: state.documentViewer.document._id,
    targetDocument: state.documentViewer.targetDocument._id
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveTargetReferenceMenu);
