import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';

export class ViewerSaveReferenceMenu extends Component {
  render() {
    return (
      <div>
        <div onClick={() => {
          let reference = this.props.reference;
          reference.sourceDocument = this.props.sourceDocument;
          this.props.saveReference(reference);
        }} className="float-btn__main"><i className="fa fa-save"></i></div>
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
    sourceDocument: state.documentViewer.document._id
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveReferenceMenu);
