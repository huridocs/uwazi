import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translate } from 'app/I18N';

import { Icon } from 'UI';
import { addReference, saveTargetRangedReference } from '../actions/referencesActions';
import { cancelTargetDocument } from '../actions/documentActions';
import { toggleReferences } from '../actions/uiActions';

class TargetDocumentHeader extends Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
  }

  componentDidUpdate(prevProps) {
    const shouldToggle =
      prevProps.uiState.get('connecting') !== this.props.uiState.get('connecting');

    if (shouldToggle) {
      const toggleState = !this.props.uiState.get('connecting');
      this.props.toggleReferences(toggleState);
    }
  }

  save() {
    const { reference, connection } = this.props;
    const { targetRange, targetFile } = reference;
    return this.props.saveTargetRangedReference(connection.toJS(), targetRange, targetFile, ref => {
      this.props.addReference(ref, true);
    });
  }

  render() {
    const { targetDocument, reference } = this.props;
    const { targetRange } = reference;

    let className = 'hidden btn btn-default';

    if (targetDocument && targetRange) {
      className = 'btn btn-success';
    }

    return (
      <div>
        <div className="relationship-steps is-fixed">
          <button
            type="button"
            onClick={this.props.cancelTargetDocument}
            className="btn btn-default"
          >
            <Icon icon="arrow-left" />
            <Translate>Back</Translate>
          </button>
          <h2>
            <Translate>Select target paragraph</Translate>
            <small>3</small>
          </h2>
        </div>
        <div className="ContextMenu ContextMenu-center">
          <button type="button" onClick={this.save} className={className}>
            <Icon icon="save" />
            <span className="ContextMenu-tooltip">
              <Translate>Save</Translate>
            </span>
          </button>
        </div>
      </div>
    );
  }
}

TargetDocumentHeader.propTypes = {
  connection: PropTypes.object,
  reference: PropTypes.object,
  targetDocument: PropTypes.string,
  saveTargetRangedReference: PropTypes.func,
  cancelTargetDocument: PropTypes.func,
  addReference: PropTypes.func,
  toggleReferences: PropTypes.func,
  uiState: PropTypes.object,
};

function mapStateToProps({ documentViewer, connections }) {
  return {
    connection: connections.connection,
    uiState: connections.uiState,
    reference: documentViewer.uiState.toJS().reference,
    targetDocument: documentViewer.targetDoc.get('_id'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      saveTargetRangedReference,
      cancelTargetDocument,
      addReference,
      toggleReferences,
    },
    dispatch
  );
}

export { TargetDocumentHeader };
export default connect(mapStateToProps, mapDispatchToProps)(TargetDocumentHeader);
