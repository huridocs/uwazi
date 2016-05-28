import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Document from 'app/Viewer/components/Document';
import {setTargetSelection, unsetTargetSelection} from 'app/Viewer/actions/selectionActions';

const mapStateToProps = ({documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  return {
    doc: documentViewer.targetDoc,
    docHTML: documentViewer.targetDocHTML,
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
