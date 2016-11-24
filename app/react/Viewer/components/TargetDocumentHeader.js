import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {addReference, saveTargetRangedReference} from '../actions/referencesActions';
import {cancelTargetDocument} from '../actions/documentActions';

export class TargetDocumentHeader extends Component {

  save(connection, targetRange) {
    return this.props.saveTargetRangedReference(connection.toJS(), targetRange, (ref) => {
      this.props.addReference(ref, this.props.pdfInfo.toJS(), true);
    });
  }

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
        <button onClick={this.save.bind(this, connection, targetRange)}
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
  connection: PropTypes.object,
  pdfInfo: PropTypes.object,
  reference: PropTypes.object,
  targetDocument: PropTypes.string,
  saveTargetRangedReference: PropTypes.func,
  cancelTargetDocument: PropTypes.func,
  addReference: PropTypes.func
};


function mapStateToProps({documentViewer, connections}) {
  return {
    connection: connections.connection,
    reference: documentViewer.uiState.toJS().reference,
    targetDocument: documentViewer.targetDoc.get('_id'),
    pdfInfo: documentViewer.doc.get('pdfInfo')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    saveTargetRangedReference,
    cancelTargetDocument,
    addReference
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);
