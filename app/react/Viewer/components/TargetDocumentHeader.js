import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Icon } from 'UI';
import { addReference, saveTargetRangedReference } from '../actions/referencesActions';
import { cancelTargetDocument } from '../actions/documentActions';

export class TargetDocumentHeader extends Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
  }

  save() {
    const { reference, connection } = this.props;
    const { targetRange, targetFile } = reference;
    return this.props.saveTargetRangedReference(connection.toJS(), targetRange, targetFile, ref => {
      this.props.addReference(ref, this.props.pdfInfo.toJS(), true);
    });
  }

  render() {
    const { targetDocument, reference } = this.props;
    const { targetRange } = reference;

    let className = 'btn btn-default hidden';

    if (targetDocument && targetRange) {
      className = 'btn btn-success';
    }

    return (
      <div>
        <div className="relationship-steps is-fixed">
          <button onClick={this.props.cancelTargetDocument} className="btn btn-default">
            <Icon icon="arrow-left" />
            Back
          </button>
          <h2>
            Select target paragraph<small>3</small>
          </h2>
        </div>
        <div className="ContextMenu ContextMenu-center">
          <button onClick={this.save} className={className}>
            <Icon icon="save" />
            <span className="ContextMenu-tooltip">Save</span>
          </button>
        </div>
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
  addReference: PropTypes.func,
};

function mapStateToProps({ documentViewer, connections }) {
  return {
    connection: connections.connection,
    reference: documentViewer.uiState.toJS().reference,
    targetDocument: documentViewer.targetDoc.get('_id'),
    pdfInfo: documentViewer.doc.getIn(['defaultDoc', 'pdfInfo']),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      saveTargetRangedReference,
      cancelTargetDocument,
      addReference,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);
