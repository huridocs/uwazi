import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveReference} from 'app/Viewer/actions/referencesActions';

export class ViewerSaveReferenceMenu extends Component {
  render() {
    return (
      <div>
        <div onClick={() => {
          this.props.saveReference({sourceRange: this.props.sourceRange, targetDocument: this.props.targetDocument});
        }} className="float-btn__main"><i className="fa fa-save"></i></div>
      </div>
    );
  }
}

ViewerSaveReferenceMenu.propTypes = {
  saveReference: PropTypes.func,
  sourceRange: PropTypes.object,
  targetDocument: PropTypes.string
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveReference}, dispatch);
}

function mapStateToProps(state) {
  return {
    sourceRange: state.documentViewer.uiState.toJS().selection,
    targetDocument: state.documentViewer.uiState.toJS().targetDocument
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerSaveReferenceMenu);
