import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';
import validate from 'validate.js';

export class ViewerSaveReferenceMenu extends Component {
  render() {
    let reference = this.props.reference;
    reference.sourceDocument = this.props.sourceDocument;

    let tab = 'connections';

    const validator = {
      sourceDocument: {presence: true},
      targetDocument: {presence: true},
      relationType: {presence: true}
    };

    if (this.props.basic) {
      delete reference.sourceRange;
    }

    if (!this.props.basic) {
      validator.sourceRange = {presence: true};
      tab = 'references';
    }

    let referenceReady = !validate(reference, validator);

    return (
      <button className="btn btn-success" disabled={!referenceReady} onClick={() => {
        if (referenceReady) {
          this.props.saveReference(reference, tab);
        }
      }} >
      <i className="fa fa-save"></i>
      </button>
    );
  }
}

ViewerSaveReferenceMenu.propTypes = {
  saveReference: PropTypes.func,
  sourceDocument: PropTypes.string,
  reference: PropTypes.object,
  basic: PropTypes.bool
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveReference}, dispatch);
}

function mapStateToProps(state) {
  return {
    reference: state.documentViewer.uiState.toJS().reference,
    sourceDocument: state.documentViewer.doc.get('_id')
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveReferenceMenu);
