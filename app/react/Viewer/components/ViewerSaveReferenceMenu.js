import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';
import validate from 'validate.js';

export class ViewerSaveReferenceMenu extends Component {
  render() {
    let reference = this.props.reference;
    reference.sourceDocument = this.props.sourceDocument;
    let referenceReady = !validate(reference, {
      sourceDocument: {presence: true},
      targetDocument: {presence: true},
      sourceRange: {presence: true}
    });

    return (
      <div>
        <div onClick={() => {
          if (referenceReady) {
            this.props.saveReference(reference);
          }
        }} className="float-btn__main">
          <i className={'fa ' + (referenceReady ? 'fa-save' : 'fa-hand-pointer-o')}></i>
        </div>
      </div>
    );
  }
}

ViewerSaveReferenceMenu.propTypes = {
  saveReference: PropTypes.func,
  sourceDocument: PropTypes.string,
  reference: PropTypes.object
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
