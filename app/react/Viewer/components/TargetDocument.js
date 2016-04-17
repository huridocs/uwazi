import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Document from 'app/Viewer/components/Document';
import {setTargetSelection, unsetTargetSelection} from 'app/Viewer/actions/selectionActions';

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    document: state.documentViewer.targetDocument,
    selection: uiState.reference.targetRange,
    references: [],
    className: 'targetDocument',
    highlightReference: () => {}
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    setSelection: setTargetSelection,
    unsetSelection: unsetTargetSelection
  },
  dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
