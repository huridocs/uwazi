import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {actions} from 'app/BasicReducer';
import {unsetTargetSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {saveReference} from 'app/Viewer/actions/referencesActions';
import {openPanel} from 'app/Viewer/actions/uiActions';

export class TargetDocumentHeader extends Component {

  back() {
    this.props.unset('viewer/targetDoc');
    this.props.unset('viewer/targetDocHTML');
    this.props.unset('viewer/targetDocReferences');
    this.props.unsetTargetSelection();
    this.props.openPanel('targetReferencePanel');
  }

  save() {
    if (!this.props.reference.targetRange) {
      return;
    }

    let reference = this.props.reference;
    reference.sourceDocument = this.props.sourceDocument;
    return this.props.saveReference(reference);
  }

  render() {
    let disabled = true;
    let className = 'btn btn-default';
    if (this.props.targetDocument && this.props.reference.targetRange) {
      disabled = false;
      className = 'btn btn-success';
    }

    return (
      <div className="relationship-steps">
        <button onClick={this.back.bind(this)} className="btn btn-default">
          <i className="fa fa-arrow-left"></i>
          Back
        </button>
        <button onClick={this.save.bind(this)} disabled={disabled} className={className}>
          <i className="fa fa-save"></i>
          Save
        </button>
        <h2>Select target paragraph<small>3</small></h2>
      </div>
    );
  }
}

TargetDocumentHeader.propTypes = {
  unset: PropTypes.func,
  unsetTargetSelection: PropTypes.func,
  openPanel: PropTypes.func,
  unsetSelection: PropTypes.func,
  reference: PropTypes.object,
  sourceDocument: PropTypes.string,
  targetDocument: PropTypes.string,
  saveReference: PropTypes.func
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators({unset: actions.unset, unsetTargetSelection, unsetSelection, openPanel, saveReference}, dispatch);
}

function mapStateToProps(state) {
  return {
    reference: state.documentViewer.uiState.toJS().reference,
    sourceDocument: state.documentViewer.doc.get('_id'),
    targetDocument: state.documentViewer.targetDoc.get('_id')
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);
