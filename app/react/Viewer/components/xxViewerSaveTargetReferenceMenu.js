import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';
import {loadTargetDocument} from 'app/Viewer/actions/documentActions';

export class ViewerSaveTargetReferenceMenu extends Component {
  handleClick() {
    if (this.props.reference.targetDocument && !this.props.targetDocument) {
      this.props.loadTargetDocument(this.props.reference.targetDocument);
    }
  }

  render() {
    let disabled = true;
    let className = 'fa-arrow-right';
    if (this.props.reference.targetDocument && !this.props.targetDocument && this.props.reference.relationType) {
      disabled = false;
    }

    return (
      <button className="edit-metadata btn btn-success" disabled={disabled} onClick={() => this.handleClick()}>
        <i className={'fa ' + className}></i>
      </button>
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
    sourceDocument: state.documentViewer.doc.get('_id'),
    targetDocument: state.documentViewer.targetDoc.get('_id')
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveTargetReferenceMenu);
