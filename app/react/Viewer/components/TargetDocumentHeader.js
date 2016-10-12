import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {actions} from 'app/BasicReducer';
import {unsetTargetSelection, unsetSelection} from '../actions/selectionActions';
import {addReference, saveTargetRangedReference} from '../actions/referencesActions';
import {cancelTargetDocument} from '../actions/documentActions';
import {actions as connectionsActions} from 'app/Connections';

export class TargetDocumentHeader extends Component {
  render() {
    const {targetDocument, reference, connection} = this.props;
    const {targetRange} = reference;

    let disabled = true;
    let className = 'btn btn-default';

    if (targetDocument && targetRange) {
      disabled = false;
      className = 'btn btn-success';
    }

    return (
      <div className="relationship-steps is-fixed">
        <button onClick={this.props.cancelTargetDocument} className="btn btn-default">
          <i className="fa fa-arrow-left"></i>
          Back
        </button>
        <button onClick={() => this.props.saveTargetRangedReference(connection.toJS(), targetRange, this.props.addReference)}
                disabled={disabled}
                className={className}>
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
  unsetSelection: PropTypes.func,
  saveTargetRangedReference: PropTypes.func,
  cancelTargetDocument: PropTypes.func,
  connection: PropTypes.object,
  reference: PropTypes.object,
  targetDocument: PropTypes.string,
  saveConnection: PropTypes.func,
  addReference: PropTypes.func
};


function mapStateToProps({documentViewer, connections}) {
  return {
    connection: connections.connection,
    reference: documentViewer.uiState.toJS().reference,
    targetDocument: documentViewer.targetDoc.get('_id')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    unset: actions.unset,
    saveConnection: connectionsActions.saveConnection,
    saveTargetRangedReference,
    cancelTargetDocument,
    unsetTargetSelection,
    unsetSelection,
    addReference
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);
